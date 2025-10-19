import React, { useState, useRef } from 'react';

// Hook с логикой ленточного шифра
export function useTapeCipher() {
  function parseTape(tapeStr) {
    if (!tapeStr) return [];
    return tapeStr
      .split(/[,;\s]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const n = Number(s);
        return Number.isFinite(n) ? Math.floor(n) : 0;
      });
  }

  function encrypt(text, tapeStr) {
    const tape = parseTape(tapeStr);
    if (tape.length === 0) return text;
    const out = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const shift = tape[i % tape.length];
      const shifted = (code + (shift % 65536) + 65536) % 65536;
      out.push(String.fromCharCode(shifted));
    }
    return out.join('');
  }

  function decrypt(text, tapeStr) {
    const tape = parseTape(tapeStr);
    if (tape.length === 0) return text;
    const out = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const shift = tape[i % tape.length];
      const shifted = (code - (shift % 65536) + 65536) % 65536;
      out.push(String.fromCharCode(shifted));
    }
    return out.join('');
  }

  function generateRandomTape(length, maxValue = 255) {
    const arr = [];
    for (let i = 0; i < length; i++) arr.push(Math.floor(Math.random() * (maxValue + 1)));
    return arr.join(',');
  }

  return { encrypt, decrypt, generateRandomTape, parseTape };
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const { encrypt, decrypt, generateRandomTape, parseTape } = useTapeCipher();

  const [originalText, setOriginalText] = useState('');
  const [resultText, setResultText] = useState('');
  const [tapeInput, setTapeInput] = useState('1,2,3,4,5');
  const [mode, setMode] = useState('encrypt');
  const [filename, setFilename] = useState('result.txt');
  const fileInputRef = useRef(null);

  function handleFileLoad(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = String(ev.target.result || '');
      setOriginalText(text);
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = String(ev.target.result || '');
      setOriginalText(text);
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleEncryptDecrypt() {
    try {
      const tape = parseTape(tapeInput);
      if (tape.length === 0) {
        alert('Ключ (лента) пустой или некорректный. Укажите значения через запятую или пробел.');
        return;
      }
      const res = mode === 'encrypt' ? encrypt(originalText, tapeInput) : decrypt(originalText, tapeInput);
      setResultText(res);
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка при обработке. Проверьте ввод.');
    }
  }

  function handleGenerateTape() {
    const lengthStr = prompt('Укажите длину генерации ключа (целое число):', '5');
    if (!lengthStr) return;
    const n = Math.max(1, Math.min(1000, parseInt(lengthStr, 10) || 0));
    const gen = generateRandomTape(n);
    setTapeInput(gen);
  }

  function handleDownloadResult() {
    downloadTextFile(filename || (mode === 'encrypt' ? 'encrypted.txt' : 'decrypted.txt'), resultText);
  }

  function clearAll() {
    setOriginalText('');
    setResultText('');
    setTapeInput('');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <header className="mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold">Ленточный шифр — Tape Cipher (SPA)</h1>
          <p className="text-sm text-gray-600 mt-1">Загрузите .txt, укажите ленту (ключ) и шифруйте / расшифровывайте текст.</p>
        </header>

        <section className="bg-white p-4 md:p-6 rounded-2xl shadow-md">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="md:w-1/3 flex flex-col gap-4">
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center bg-gray-50"
              >
                <p className="text-sm text-gray-600 mb-2">Перетащите .txt сюда или используйте кнопку</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={handleFileLoad}
                />
                <button
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm md:text-base"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Выбрать файл
                </button>
              </div>

              <div className="p-3 rounded-lg bg-gray-100">
                <label className="block text-sm font-medium text-gray-700">Ключ (лента)</label>
                <input
                  value={tapeInput}
                  onChange={e => setTapeInput(e.target.value)}
                  placeholder="Пример: 1,2,3,4,5 или через пробел"
                  className="mt-2 w-full p-2 rounded-md border border-gray-300 bg-white text-sm"
                />
                <div className="mt-2 flex gap-2">
                  <button className="px-3 py-1 rounded-md border text-sm" onClick={handleGenerateTape}>Сгенерировать</button>
                  <button
                    className="px-3 py-1 rounded-md border text-sm"
                    onClick={() => setTapeInput('1,2,3,4,5')}
                  >
                    Пример
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Лента — последовательность целых чисел. Каждое число используется как сдвиг для соответствующего символа.</p>
              </div>

              <div className="p-3 rounded-lg bg-gray-100 flex flex-col gap-2">
                <label className="text-sm font-medium">Режим</label>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded-md text-sm ${mode === 'encrypt' ? 'bg-sky-600 text-white' : 'border'}`}
                    onClick={() => setMode('encrypt')}
                  >
                    Зашифровать
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-sm ${mode === 'decrypt' ? 'bg-sky-600 text-white' : 'border'}`}
                    onClick={() => setMode('decrypt')}
                  >
                    Расшифровать
                  </button>
                </div>

                <div className="mt-2 flex gap-2">
                  <button className="flex-1 px-3 py-2 rounded-md bg-green-600 text-white" onClick={handleEncryptDecrypt}>
                    Выполнить
                  </button>
                  <button className="px-3 py-2 rounded-md bg-gray-200" onClick={clearAll}>Очистить</button>
                </div>

                <div className="mt-2">
                  <label className="block text-sm">Имя файла результата</label>
                  <input value={filename} onChange={e => setFilename(e.target.value)} className="mt-1 p-2 w-full rounded-md border" />
                </div>

                <div className="mt-2 flex gap-2">
                  <button className="px-3 py-2 rounded-md bg-indigo-600 text-white flex-1" onClick={handleDownloadResult}>
                    Скачать результат
                  </button>
                </div>
              </div>
            </div>

            <div className="md:w-2/3 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Исходный текст</label>
                <textarea
                  value={originalText}
                  onChange={e => setOriginalText(e.target.value)}
                  placeholder="Содержимое файла появится здесь. Вы также можете вставить текст вручную."
                  rows={8}
                  className="mt-2 w-full p-3 rounded-lg border resize-vertical min-h-[160px] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Результат ({mode === 'encrypt' ? 'зашифрованный' : 'расшифрованный'})</label>
                <textarea
                  value={resultText}
                  onChange={e => setResultText(e.target.value)}
                  rows={8}
                  className="mt-2 w-full p-3 rounded-lg border resize-vertical min-h-[160px] text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <div>Длина ленты: {parseTape(tapeInput).length}</div>
                <div>Поддержка UTF-16: сдвиг применяется к кодовым единицам символов.</div>
                <div>Подойдет для демонстрации работы древнего ленточного шифра и образовательных задач.</div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-6 text-center text-sm text-gray-500">
          <div>Архитектура: компоненты + хук для логики шифрования. Адаптивный дизайн (Tailwind CSS).</div>
          <div className="mt-2">Инструкции по установке: создайте React-проект (Vite или Create React App), подключите Tailwind и поместите этот компонент в <code>src/App.jsx</code>.</div>
        </footer>
      </div>
    </div>
  );
}
