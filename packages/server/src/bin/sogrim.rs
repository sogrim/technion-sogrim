use std::path::PathBuf;

use clap::{Parser, Subcommand};
use sogrim_server::cli::{catalog, fetcher};
use sogrim_server::db::Db;

#[derive(Parser)]
#[command(name = "sogrim", about = "Sogrim operations CLI", version)]
struct Cli {
    /// MongoDB URI (overrides SOGRIM_URI env var)
    #[arg(long, env = "SOGRIM_URI", global = true)]
    uri: Option<String>,

    /// Database profile/name (overrides SOGRIM_PROFILE env var)
    #[arg(long, env = "SOGRIM_PROFILE", default_value = "debug", global = true)]
    profile: String,

    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Manage catalogs in MongoDB
    Catalog {
        #[command(subcommand)]
        action: CatalogAction,
    },
    /// Fetch course data from Technion SAP
    Fetcher(fetcher::FetcherArgs),
}

#[derive(Subcommand)]
enum CatalogAction {
    /// Upsert catalog JSON files into MongoDB (insert or update by name)
    Upsert {
        /// JSON file paths to upsert
        files: Vec<PathBuf>,
    },
    /// List catalogs in the database
    List,
    /// Download a catalog from the database to a local JSON file
    Download {
        /// Catalog name (Hebrew, e.g. "מדמח ארבע שנתי 2025-2026")
        name: String,
        /// Output file path
        #[arg(short, long)]
        output: PathBuf,
    },
    /// Delete a catalog from the database by ObjectId (use `list` to find IDs)
    Delete {
        /// Catalog ObjectId (24-char hex, from `catalog list`)
        id: String,
    },
}

async fn connect_db(cli: &Cli) -> Db {
    let uri = cli.uri.as_deref().unwrap_or_else(|| {
        eprintln!("Error: MongoDB URI required. Set SOGRIM_URI or pass --uri");
        std::process::exit(1);
    });
    Db::connect(uri, &cli.profile).await.unwrap_or_else(|e| {
        eprintln!("Error: {e}");
        std::process::exit(1);
    })
}

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();
    let cli = Cli::parse();

    let (result, db) = match cli.command {
        Command::Catalog { ref action } => {
            let db = connect_db(&cli).await;
            let result = match action {
                CatalogAction::Upsert { files } => catalog::upsert(&db, files).await,
                CatalogAction::List => catalog::list(&db).await,
                CatalogAction::Download { name, output } => {
                    catalog::download(&db, name, output).await
                }
                CatalogAction::Delete { id } => catalog::delete(&db, id).await,
            };
            (result, Some(db))
        }
        Command::Fetcher(args) => {
            fetcher::run(args).await;
            (Ok(()), None)
        }
    };

    if let Some(db) = db {
        db.shutdown().await;
    }

    if let Err(e) = result {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }
}
