use tauri::AppHandle;
use serde::{Deserialize, Serialize};
use futures_util::StreamExt;
use tauri::Manager;
use tauri::Emitter;
#[derive(Serialize, Deserialize, Clone)]
struct ChatMessage {
    role: String,
    content: String,
}

#[tauri::command]
async fn ollama_chat_stream(
    app_handle: AppHandle,
    url: String,
    model: String,
    messages: Vec<ChatMessage>,
) -> Result<(), String> {
    println!("🦀 Starting Ollama stream...");

    let client = reqwest::Client::new();
    let request_body = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": true,
    });

    let response = client.post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    println!("🦀 Response received — streaming...");

    let main_window = app_handle.get_webview_window("main")
        .ok_or("Main window not found")?;

    let mut stream = response.bytes_stream();
    let mut chunk_count = 0;

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(chunk) => {
                chunk_count += 1;
                let text = String::from_utf8_lossy(&chunk).to_string();

                println!("📦 Chunk #{}: {} bytes", chunk_count, chunk.len());

                // 🔹 Emit sur la fenêtre principale
                main_window.emit("ollama-chunk", text)
                    .map_err(|e| e.to_string())?;
            }
            Err(e) => {
                println!("❌ Error reading chunk: {}", e);
                return Err(e.to_string());
            }
        }
    }

    println!("🏁 Stream finished. Total chunks: {}", chunk_count);

    main_window.emit("ollama-done", ())
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ollama_chat_stream])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
