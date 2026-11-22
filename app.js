const form = document.querySelector("#askForm");
const question = document.querySelector("#question");
const messages = document.querySelector("#messages");
const photoInput = document.querySelector("#photoInput");
const previewWrap = document.querySelector("#previewWrap");
const preview = document.querySelector("#preview");
const send = document.querySelector("#send");
const modeLabel = document.querySelector("#modeLabel");
let mode = "Ajuda nos estudos";
let imageData = null;

document.querySelectorAll(".tool").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tool").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    mode = button.dataset.mode;
    modeLabel.textContent = mode;
    question.placeholder = mode === "Traduzir idiomas" ? "Cole o texto e diga para qual idioma..." :
      mode === "Criar imagens" ? "Descreva a imagem que você imaginou..." : "Digite sua pergunta...";
    question.focus();
  });
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return addMessage("Escolha um arquivo de imagem.", "error");
  if (file.size > 5 * 1024 * 1024) return addMessage("A foto precisa ter até 5 MB. Tente reduzir o tamanho.", "error");
  const reader = new FileReader();
  reader.onload = () => {
    imageData = reader.result;
    preview.src = imageData;
    previewWrap.hidden = false;
  };
  reader.readAsDataURL(file);
});
function clearImage() {
  imageData = null; photoInput.value = ""; preview.src = ""; previewWrap.hidden = true;
}
document.querySelector("#removeImage").addEventListener("click", clearImage);

function addMessage(text, kind) {
  const article = document.createElement("article");
  article.className = `bubble ${kind}`;
  article.textContent = text;
  messages.appendChild(article);
  messages.scrollTop = messages.scrollHeight;
  return article;
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const text = question.value.trim();
  if (!text && !imageData) return;
  addMessage((text || "Leia e resolva esta atividade.") + (imageData ? "\n📷 Foto anexada" : ""), "user");
  question.value = "";
  send.disabled = true; send.textContent = "Aguarde…";
  const pending = addMessage("Estou analisando sua solicitação…", "assistant");
  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({message:text, mode, image:imageData})
    });
    const data = await response.json();
    pending.textContent = response.ok ? data.answer : (data.error || "Não foi possível responder.");
    if (!response.ok) pending.classList.add("error");
  } catch {
    pending.textContent = "Não consegui conectar ao servidor. Confira a internet e tente novamente.";
    pending.classList.add("error");
  } finally {
    clearImage();
    send.disabled = false; send.textContent = "Enviar ↑";
    messages.scrollTop = messages.scrollHeight;
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(()=>{}));
}
