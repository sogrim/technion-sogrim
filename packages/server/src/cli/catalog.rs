use std::path::Path;

use crate::db::Db;
use crate::resources::catalog::{Catalog, Faculty};
use bson::{doc, oid::ObjectId};
use futures_util::TryStreamExt;

/// Convert MongoDB Extended JSON patterns to plain JSON values.
/// Handles `{"$numberLong": "123"}` → `123` recursively.
#[allow(dead_code)] // Used by upsert (currently todo!())
fn normalize_extended_json(value: &mut serde_json::Value) {
    match value {
        serde_json::Value::Object(map) => {
            if map.len() == 1 {
                if let Some(serde_json::Value::String(s)) = map.get("$numberLong") {
                    if let Ok(n) = s.parse::<i64>() {
                        *value = serde_json::Value::Number(n.into());
                        return;
                    }
                }
            }
            for v in map.values_mut() {
                normalize_extended_json(v);
            }
        }
        serde_json::Value::Array(arr) => {
            for v in arr {
                normalize_extended_json(v);
            }
        }
        _ => {}
    }
}

/// Upsert catalog JSON files into MongoDB.
///
/// For each file:
/// 1. Read and parse the JSON (handle Extended JSON: `$numberLong`, empty `$oid`)
/// 2. Look up existing catalog by `name` field
/// 3. If exists: reuse its `_id` and replace the document
/// 4. If new: generate a fresh `ObjectId` and insert
///
/// Hints:
/// - Use `normalize_extended_json()` to convert `{"$numberLong": "1"}` → `1`
/// - Strip `_id` from parsed JSON before deserializing (catalog JSONs have placeholder empty ObjectIds)
/// - `Catalog` has `#[serde(default)]` on `id`, so it deserializes fine without `_id`
/// - Use `db.collection::<Catalog>()` for typed MongoDB access
/// - `collection.replace_one(filter).upsert(true)` for atomic upsert
pub async fn upsert(_db: &Db, _files: &[impl AsRef<Path>]) -> Result<(), anyhow::Error> {
    todo!("Implement catalog upsert — see doc comment above for guidance")
}

/// Lightweight struct for listing catalogs (avoids deserializing all fields).
#[derive(serde::Deserialize)]
struct CatalogSummary {
    #[serde(rename = "_id")]
    id: ObjectId,
    name: String,
    #[serde(default)]
    faculty: Faculty,
    #[serde(default)]
    total_credit: f64,
}

pub async fn list(db: &Db) -> Result<(), anyhow::Error> {
    let catalogs: Vec<CatalogSummary> = db
        .client()
        .database(db.profile())
        .collection::<CatalogSummary>("Catalogs")
        .find(doc! {})
        .projection(doc! {"name": 1, "faculty": 1, "total_credit": 1})
        .sort(doc! {"name": 1})
        .await
        .map_err(|e| anyhow::anyhow!("MongoDB query failed: {e}"))?
        .try_collect()
        .await
        .map_err(|e| anyhow::anyhow!("MongoDB cursor failed: {e}"))?;

    if catalogs.is_empty() {
        println!("No catalogs found.");
        return Ok(());
    }

    println!(
        "{:<26} {:<50} {:<25} {:>8}",
        "ID", "Name", "Faculty", "Credits"
    );
    println!("{}", "-".repeat(112));
    for c in &catalogs {
        println!(
            "{:<26} {:<50} {:<25} {:>8.1}",
            c.id.to_hex(),
            c.name,
            format!("{:?}", c.faculty),
            c.total_credit
        );
    }
    println!("\n{} catalog(s)", catalogs.len());
    Ok(())
}

pub async fn delete(db: &Db, id_hex: &str) -> Result<(), anyhow::Error> {
    let oid =
        ObjectId::parse_str(id_hex).map_err(|_| anyhow::anyhow!("Invalid ObjectId: {id_hex}"))?;

    let result = db
        .collection::<Catalog>()
        .delete_one(doc! {"_id": oid})
        .await
        .map_err(|e| anyhow::anyhow!("MongoDB delete failed: {e}"))?;

    if result.deleted_count == 0 {
        anyhow::bail!("No catalog found with id {id_hex}");
    }
    eprintln!("Deleted catalog {id_hex}");
    Ok(())
}

pub async fn download(db: &Db, name: &str, output: &Path) -> Result<(), anyhow::Error> {
    let catalog: Catalog = db
        .collection::<Catalog>()
        .find_one(doc! {"name": name})
        .await
        .map_err(|e| anyhow::anyhow!("MongoDB query failed: {e}"))?
        .ok_or_else(|| anyhow::anyhow!("Catalog '{name}' not found"))?;

    let json = serde_json::to_string_pretty(&catalog)?;
    std::fs::write(output, &json)?;
    eprintln!("Downloaded \"{}\" to {}", name, output.display());
    Ok(())
}
