import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const predictGesture = (landmarks, language = 'en') =>
  api.post('/gesture/predict', { landmarks, language }).then(r => r.data);

export const speakText = async (text, language = 'en') => {
  // Try backend gTTS first, fall back to browser SpeechSynthesis
  try {
    const res = await api.post('/tts/speak', { text, language }, { responseType: 'blob' });
    const url  = URL.createObjectURL(res.data);
    const audio = new Audio(url);
    audio.play();
    return audio;
  } catch {
    // Fallback: browser Web Speech API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const langMap = { en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', kn: 'kn-IN', te: 'te-IN', mr: 'mr-IN' };
      u.lang = langMap[language] || 'en-US';
      window.speechSynthesis.speak(u);
    }
  }
};

export const getPhrases  = ()      => api.get('/gesture/phrases').then(r => r.data);
export const addPhrase   = (data)  => api.post('/gesture/phrases', data).then(r => r.data);
export const getHistory  = (n=50)  => api.get(`/history/?limit=${n}`).then(r => r.data);
export const clearHistory= ()      => api.delete('/history/clear').then(r => r.data);
