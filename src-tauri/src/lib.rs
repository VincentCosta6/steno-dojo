use std::collections::HashMap;
use tauri::{Emitter, Manager};

/// Load a Plover-format dictionary (JSON: stroke → translation)
/// and return a reverse map: word → [shortest_stroke, ...other_strokes]
#[tauri::command]
async fn load_plover_dictionary(path: String) -> Result<HashMap<String, Vec<String>>, String> {
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read dictionary: {e}"))?;

    let dict: HashMap<String, String> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse dictionary JSON: {e}"))?;

    // Build reverse map: word → list of strokes, sorted by stroke length (shorter = simpler)
    let mut reverse: HashMap<String, Vec<String>> = HashMap::new();

    for (stroke, word) in &dict {
        // Normalize: lowercase, trim whitespace
        let normalized = word.trim().to_lowercase();
        if normalized.is_empty() || normalized.starts_with('{') {
            continue; // Skip meta entries like {.}, {-|}, etc.
        }
        reverse
            .entry(normalized)
            .or_default()
            .push(stroke.clone());
    }

    // Sort each word's stroke list: prefer single-stroke entries, then by length
    for strokes in reverse.values_mut() {
        strokes.sort_by(|a, b| {
            let a_multi = a.contains('/');
            let b_multi = b.contains('/');
            if a_multi != b_multi {
                return a_multi.cmp(&b_multi);
            }
            a.len().cmp(&b.len())
        });
        strokes.dedup();
    }

    Ok(reverse)
}

/// Look up strokes for a specific word from the already-loaded dictionary.
/// Returns up to 5 stroke options.
#[tauri::command]
fn lookup_word(
    word: String,
    dictionary: HashMap<String, Vec<String>>,
) -> Vec<String> {
    let normalized = word.trim().to_lowercase();
    dictionary
        .get(&normalized)
        .map(|v| v.iter().take(5).cloned().collect())
        .unwrap_or_default()
}

/// List keyboard definition files from a directory.
#[tauri::command]
async fn list_keyboards(keyboards_dir: String) -> Result<Vec<String>, String> {
    let dir = std::path::Path::new(&keyboards_dir);
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut keyboards = vec![];
    let entries = std::fs::read_dir(dir)
        .map_err(|e| format!("Failed to read keyboards dir: {e}"))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                keyboards.push(name.to_string());
            }
        }
    }
    keyboards.sort();
    Ok(keyboards)
}

// ─── Plover detection ────────────────────────────────────────────────────────

/// Check if Plover is installed by looking for its application bundle / executable.
#[tauri::command]
fn check_plover_app_installed() -> bool {
    if cfg!(target_os = "macos") {
        std::path::Path::new("/Applications/Plover.app").exists()
    } else if cfg!(target_os = "windows") {
        [
            r"C:\Program Files\Open Steno Project\Plover\plover.exe",
            r"C:\Program Files (x86)\Open Steno Project\Plover\plover.exe",
        ]
        .iter()
        .any(|p| std::path::Path::new(p).exists())
    } else {
        // Linux: check common binary locations
        ["/usr/bin/plover", "/usr/local/bin/plover"]
            .iter()
            .any(|p| std::path::Path::new(p).exists())
    }
}

// ─── Homebrew helpers ─────────────────────────────────────────────────────────

fn find_brew() -> Option<&'static str> {
    // Apple Silicon default, then Intel/Rosetta default
    ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"]
        .iter()
        .copied()
        .find(|p| std::path::Path::new(p).exists())
}

/// Returns true if Homebrew is available on this machine.
#[tauri::command]
fn check_brew_available() -> bool {
    find_brew().is_some()
}

/// Returns true if the Plover cask is already installed via Homebrew.
#[tauri::command]
async fn check_plover_brew_installed() -> bool {
    let Some(brew) = find_brew() else { return false };
    std::process::Command::new(brew)
        .args(["list", "--cask", "plover"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Install Plover via `brew install --cask plover`.
/// Streams each output line as a `brew-progress` event.
/// Emits `brew-done` { success: bool, message: String } when finished.
#[tauri::command]
async fn brew_install_plover(app: tauri::AppHandle) -> Result<(), String> {
    use tokio::io::{AsyncBufReadExt, BufReader};
    use tokio::process::Command;

    let brew = find_brew().ok_or("Homebrew not found. Install from brew.sh first.")?;

    let mut child = Command::new(brew)
        .args(["install", "--cask", "plover"])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start brew: {e}"))?;

    // Stream stdout lines
    if let Some(stdout) = child.stdout.take() {
        let handle = app.clone();
        tokio::spawn(async move {
            let mut lines = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = handle.emit("brew-progress", &line);
            }
        });
    }

    // Stream stderr lines (brew uses stderr for progress spinners)
    if let Some(stderr) = child.stderr.take() {
        let handle = app.clone();
        tokio::spawn(async move {
            let mut lines = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = handle.emit("brew-progress", &line);
            }
        });
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Error waiting for brew: {e}"))?;

    if status.success() {
        Ok(())
    } else {
        Err("brew install failed — check the output above for details.".to_string())
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            load_plover_dictionary,
            lookup_word,
            list_keyboards,
            check_plover_app_installed,
            check_brew_available,
            check_plover_brew_installed,
            brew_install_plover,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
