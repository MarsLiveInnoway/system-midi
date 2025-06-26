import mido
from io import BytesIO

def process_midi(midi_bytes: bytes) -> BytesIO:
    """处理MIDI文件：将所有音符提高一个半音"""
    # 创建内存中的MIDI文件
    with BytesIO(midi_bytes) as input_buffer:
        mid = mido.MidiFile(file=input_buffer)
        
        # 处理所有轨道
        for track in mid.tracks:
            for msg in track:
                if msg.type in ['note_on', 'note_off']:
                    msg.note += 1  # 升一个半音
        
        # 将处理后的MIDI保存到输出缓冲区
        output_buffer = BytesIO()
        mid.save(file=output_buffer)
        output_buffer.seek(0)
        
        return output_buffer