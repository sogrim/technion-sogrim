use std::path::Path;

use crate::db::Db;
use crate::resources::catalog::{Catalog, Faculty};
use bson::{doc, oid::ObjectId};
use futures_util::TryStreamExt;

/// Convert MongoDB Extended JSON patterns to plain JSON values.
/// Handles `{"$numberLong": "123"}` → `123` recursively.
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

pub async fn upsert(db: &Db, files: &[impl AsRef<Path>]) -> Result<(), anyhow::Error> {
    for path in files {
        let path = path.as_ref();
        let text = std::fs::read_to_string(path)
            .map_err(|e| anyhow::anyhow!("Failed to read {}: {e}", path.display()))?;

        // Parse JSON and normalize MongoDB Extended JSON patterns ($numberLong, $oid)
        let mut value: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| anyhow::anyhow!("Failed to parse {}: {e}", path.display()))?;
        if let Some(obj) = value.as_object_mut() {
            obj.remove("_id"); // Strip placeholder _id — we set the real one below
        }
        normalize_extended_json(&mut value);
        let mut catalog: Catalog = serde_json::from_value(value)
            .map_err(|e| anyhow::anyhow!("Failed to deserialize {}: {e}", path.display()))?;

        let collection = db.collection::<Catalog>();
        let existing = collection
            .find_one(doc! {"name": &catalog.name})
            .await
            .map_err(|e| anyhow::anyhow!("MongoDB query failed: {e}"))?;

        let is_update = existing.is_some();
        catalog.id = existing.map(|c| c.id).unwrap_or_else(ObjectId::new);

        collection
            .replace_one(doc! {"_id": catalog.id}, &catalog)
            .upsert(true)
            .await
            .map_err(|e| anyhow::anyhow!("MongoDB upsert failed: {e}"))?;

        let verb = if is_update { "Updated" } else { "Created" };
        eprintln!("  {verb} \"{}\" ({})", catalog.name, catalog.id);
    }
    Ok(())
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
