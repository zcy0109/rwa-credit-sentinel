#![no_std]
#![no_main]
#![feature(alloc_error_handler)]

extern crate alloc;

use alloc::{collections::BTreeMap, format, string::String, vec, vec::Vec};
use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
    contracts::{EntryPoint, EntryPoints, NamedKeys},
    ApiError, CLType, CLValue, EntryPointAccess, EntryPointType, Key, Parameter,
};

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

const OWNER_KEY: &str = "owner";
const RECORDS_DICT: &str = "records";
const CONTRACT_HASH_KEY: &str = "risk_registry_contract_hash";
const CONTRACT_PACKAGE_HASH_KEY: &str = "risk_registry_package_hash";
const CONTRACT_ACCESS_KEY: &str = "risk_registry_access_uref";

const ARG_ASSET_ID: &str = "asset_id";
const ARG_RISK_SCORE: &str = "risk_score";
const ARG_DECISION: &str = "decision";
const ARG_REPORT_HASH: &str = "report_hash";
const ARG_EVIDENCE_HASH: &str = "evidence_hash";
const ARG_CREATED_AT_MS: &str = "created_at_ms";

#[repr(u16)]
enum RegistryError {
    NotOwner = 1,
    InvalidScore = 2,
    MissingOwner = 3,
    MissingRecords = 4,
}

impl From<RegistryError> for ApiError {
    fn from(error: RegistryError) -> Self {
        ApiError::User(error as u16)
    }
}

#[no_mangle]
pub extern "C" fn call() {
    let (package_hash, access_uref) = storage::create_contract_package_at_hash();
    let records_uref = storage::new_dictionary(RECORDS_DICT).unwrap_or_revert();

    let mut named_keys = NamedKeys::new();
    named_keys.insert(OWNER_KEY.into(), Key::Account(runtime::get_caller()));
    named_keys.insert(RECORDS_DICT.into(), records_uref.into());

    let (contract_hash, _) = storage::add_contract_version(
        package_hash,
        entry_points().into(),
        named_keys,
        BTreeMap::new(),
    );

    runtime::put_key(CONTRACT_HASH_KEY, contract_hash.into());
    runtime::put_key(CONTRACT_PACKAGE_HASH_KEY, package_hash.into());
    runtime::put_key(CONTRACT_ACCESS_KEY, access_uref.into());
}

#[no_mangle]
pub extern "C" fn record_credential() {
    assert_owner();

    let asset_id: String = runtime::get_named_arg(ARG_ASSET_ID);
    let risk_score: u8 = runtime::get_named_arg(ARG_RISK_SCORE);
    if risk_score > 100 {
        runtime::revert(RegistryError::InvalidScore);
    }

    let decision: String = runtime::get_named_arg(ARG_DECISION);
    let report_hash: String = runtime::get_named_arg(ARG_REPORT_HASH);
    let evidence_hash: String = runtime::get_named_arg(ARG_EVIDENCE_HASH);
    let created_at_ms: u64 = runtime::get_named_arg(ARG_CREATED_AT_MS);
    let issuer = format!("{:?}", runtime::get_caller());
    let record = format!(
        "{{\"asset_id\":\"{}\",\"risk_score\":{},\"decision\":\"{}\",\"report_hash\":\"{}\",\"evidence_hash\":\"{}\",\"issuer\":\"{}\",\"created_at_ms\":{}}}",
        asset_id, risk_score, decision, report_hash, evidence_hash, issuer, created_at_ms
    );

    storage::dictionary_put(records_uref(), &asset_id, record);
}

#[no_mangle]
pub extern "C" fn get_credential() {
    let asset_id: String = runtime::get_named_arg(ARG_ASSET_ID);
    let record = storage::dictionary_get::<String>(records_uref(), &asset_id)
        .unwrap_or_revert()
        .unwrap_or_default();
    runtime::ret(CLValue::from_t(record).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn owner() {
    let owner = match runtime::get_key(OWNER_KEY).unwrap_or_revert_with(RegistryError::MissingOwner)
    {
        Key::Account(account_hash) => format!("{:?}", account_hash),
        _ => runtime::revert(RegistryError::MissingOwner),
    };
    runtime::ret(CLValue::from_t(owner).unwrap_or_revert());
}

fn entry_points() -> EntryPoints {
    let mut entry_points = EntryPoints::new();
    entry_points.add_entry_point(EntryPoint::new(
        "record_credential",
        vec![
            Parameter::new(ARG_ASSET_ID, CLType::String),
            Parameter::new(ARG_RISK_SCORE, CLType::U8),
            Parameter::new(ARG_DECISION, CLType::String),
            Parameter::new(ARG_REPORT_HASH, CLType::String),
            Parameter::new(ARG_EVIDENCE_HASH, CLType::String),
            Parameter::new(ARG_CREATED_AT_MS, CLType::U64),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        "get_credential",
        vec![Parameter::new(ARG_ASSET_ID, CLType::String)],
        CLType::String,
        EntryPointAccess::Public,
        EntryPointType::Called,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        "owner",
        Vec::new(),
        CLType::String,
        EntryPointAccess::Public,
        EntryPointType::Called,
    ));
    entry_points
}

fn assert_owner() {
    let caller = runtime::get_caller();
    match runtime::get_key(OWNER_KEY).unwrap_or_revert_with(RegistryError::MissingOwner) {
        Key::Account(owner) if owner == caller => {}
        _ => runtime::revert(RegistryError::NotOwner),
    }
}

fn records_uref() -> casper_types::URef {
    match runtime::get_key(RECORDS_DICT).unwrap_or_revert_with(RegistryError::MissingRecords) {
        Key::URef(uref) => uref,
        _ => runtime::revert(RegistryError::MissingRecords),
    }
}

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    core::arch::wasm32::unreachable()
}

#[alloc_error_handler]
fn oom(_: core::alloc::Layout) -> ! {
    core::arch::wasm32::unreachable()
}
