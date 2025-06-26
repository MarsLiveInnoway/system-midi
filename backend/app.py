from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
from midi_utils import process_midi

app = FastAPI()

# 核心MIDI处理API
@app.post("/process-midi")
async def process_midi_file(file: UploadFile = File(...)):
    try:
        print(f"Processing MIDI file: {file.filename}")
        midi_data = await file.read()
        processed_data = process_midi(midi_data)
        
        return StreamingResponse(
            processed_data,
            media_type="audio/midi",
            headers={"Content-Disposition": f"attachment; filename=processed_{file.filename}"}
        )
    except Exception as e:
        print(f"Error processing MIDI: {e}")
        return {"error": str(e)}

@app.get("/health")
def health_check():
    return {"status": "OK", "version": "1.1.0"}

# --- 新增部分：提供前端服务 ---

# 挂载静态文件目录，所有Next.js生成的文件都在这里
# '/_next', '/favicon.ico' 等请求会由这里处理
app.mount("/_next", StaticFiles(directory="static/_next"), name="next-assets")



# 定义一个捕获所有路径的路由，作为单页应用(SPA)的入口
# 任何未匹配到API的GET请求，都返回index.html
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # 检查请求的文件是否存在于static目录中
    file_path = os.path.join("static", full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    # 如果是目录或不存在，则默认返回主页
    return FileResponse("static/index.html")

# 确保根路径'/'也返回index.html
@app.get("/")
async def root():
    return FileResponse('static/index.html')

# (可选，但推荐) 移除CORS，因为前后端现在是同源的
# 如果您仍希望从其他地方调用API，可以保留
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

if __name__ == "__main__":
    import uvicorn
    # Hugging Face Spaces 默认使用 7860 端口
    uvicorn.run(app, host="0.0.0.0", port=7860)