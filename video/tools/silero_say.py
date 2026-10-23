# Silero TTS (v4_ru) → WAV. Usage: silero_say.py <speaker> <out.wav> <text|@file> [excited]
import sys, wave, torch, pathlib
spk, out, text = sys.argv[1], sys.argv[2], sys.argv[3]
if text.startswith('@'): text = open(text[1:], encoding='utf-8').read().strip()
excited = len(sys.argv) > 4
m = torch.package.PackageImporter(str(pathlib.Path(__file__).parent / 'silero/v4_ru.pt')).load_pickle('tts_models', 'model'); m.to('cpu')
if excited:
    ssml = f'<speak><prosody rate="fast" pitch="high">{text}</prosody></speak>'
    audio = m.apply_tts(ssml_text=ssml, speaker=spk, sample_rate=48000)
else:
    audio = m.apply_tts(text=text, speaker=spk, sample_rate=48000, put_accent=True, put_yo=True)
pcm = (audio.clamp(-1, 1) * 32767).to(torch.int16).numpy().tobytes()
with wave.open(out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000); w.writeframes(pcm)
