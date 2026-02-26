// 채팅 UI
const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

// LLM과 주고받을 전체 대화 내역
const llmMessages = [
  {
    role: "system",
    content:
      "너는 코딩 자율학습단 안내 챗봇 '코천'이야. 한국어로만 답하고, 사용자의 상황을 정리해 주면서 9권 책 중 어울리는 책을 친근하게 추천해 줘.",
  },
];

function appendBotMessage(html) {
  const row = document.createElement("div");
  row.className = "message-row bot";

  const avatar = document.createElement("div");
  avatar.className = "avatar-bubble";
  const img = document.createElement("img");
  img.src = "assets/kochun.png";
  img.alt = "코딩천재 코천 캐릭터";
  avatar.appendChild(img);

  const bubble = document.createElement("div");
  bubble.className = "bubble bot";
  bubble.innerHTML = html;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendUserMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row user";

  const bubble = document.createElement("div");
  bubble.className = "bubble user";
  bubble.textContent = text;

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message-row bot";
  row.id = "typing-indicator-row";

  const avatar = document.createElement("div");
  avatar.className = "avatar-bubble";
  const img = document.createElement("img");
  img.src = "assets/kochun.png";
  img.alt = "코딩천재 코천 캐릭터";
  avatar.appendChild(img);

  const bubble = document.createElement("div");
  bubble.className = "bubble bot";
  bubble.innerHTML = `
    <span class="typing-indicator">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </span>
  `;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const row = document.getElementById("typing-indicator-row");
  if (row) {
    row.remove();
  }
}

function buildReason(main, profile, message) {
  const { level, interests } = profile;
  const text = message.toLowerCase();

  switch (main.id) {
    case 1:
      if (level === "beginner") {
        return "코딩이 완전 처음이어도, 파이썬으로 기초를 하나씩 쌓으면서 전체 흐름을 익히기 좋아.";
      }
      return "파이썬으로 기본 문법과 코딩 감각을 다시 정리하고 싶을 때 부담 없이 보기 좋은 책이야.";
    case 3:
      return "브라우저만 있으면 바로 웹 화면을 만들어 볼 수 있어서, 눈에 보이는 결과를 빨리 보고 싶은 입문자에게 잘 맞아.";
    case 4:
      return "데이터를 제대로 다루려면 SQL이 꼭 필요해서, 나중에 어떤 분야로 가더라도 기본 체력을 만들어 줄 수 있어.";
    case 5:
      return "엑셀 느낌에서 출발해서 파이썬 데이터 분석까지 이어져서, 실무 보고서나 분석에 바로 써먹기 좋아.";
    case 6:
      return "개발자 아니어도 업무에 코딩과 자동화를 살짝 섞어 보고 싶은 사람한테 딱 맞는 구성이라서야.";
    case 7:
      if (text.includes("만들어보고") || text.includes("서비스")) {
        return "‘뭔가 서비스를 직접 만들어보고 싶다’는 마음에 딱 맞게, AI랑 커서를 써서 웹 서비스를 끝까지 완성해 보는 흐름이 들어 있어.";
      }
      return "요즘 스타일대로 AI와 커서를 활용해서, 처음부터 웹 서비스를 만들어 보면서 배우게 해 주는 책이야.";
    case 8:
      return "AI 에이전트 쪽으로 깊게 파고들고 싶을 때, 내부 구조까지 차근차근 짚어 보는 심화 과정으로 좋아.";
    case 9:
      return "이미 코드를 조금 다루고 있다면, 다양한 AI CLI 도구들을 활용해서 개발 생산성을 확 끌어올릴 수 있게 도와줘.";
    case 2:
    default:
      return "C 언어 기초를 정석대로 익히고 싶을 때, 포인터 같은 개념도 차근차근 다뤄 주는 입문용이라서야.";
  }
}

function formatRecommendation(message) {
  const profile = inferProfile(message);
  const ranked = scoreBooks(message);
  const top = ranked.filter((item) => item.score > 0).slice(0, 3);

  if (top.length === 0) {
    return `
      음, 지금 이야기만으로는 <strong>어느 책이 딱 맞는지</strong>를 아직 잘 모르겠어.<br />
      코천이 더 잘 고르려면, 코딩 경험이랑 <strong>웹·데이터·AI·업무 자동화</strong> 중에 뭐가 제일 끌리는지만 한 번 더 말해 줄래?
    `;
  }

  const main = top[0].book;
  const reason = buildReason(main, profile, message);

  const secondary = top.slice(1);
  const chips =
    secondary.length > 0
      ? secondary
          .map(
            (item) => `
        <span class="book-chip">
          <a href="${item.book.url}" target="_blank" rel="noopener">
            ${item.book.title}
          </a>
        </span>
      `
          )
          .join("")
      : "";

  return `
    지금까지 네가 말해준 걸 들어보면,<br />
    <span class="recommendation-highlight">
      <strong>지금 딱 맞는 책 1순위는</strong><br />
      <strong>${main.title}</strong> 인 것 같아.
      <br /><br />
      코천이 이렇게 고른 이유는…<br />
      <em>${reason}</em>
      <br /><br />
      ${
        chips
          ? `이 분위기가 마음에 든다면, 아래 책들도 같이 살펴보면 좋아!<div class="book-chip-row">${chips}</div>`
          : ""
      }
    </span>
  `;
}

async function handleUserMessage(text) {
  if (!text.trim()) return;

  appendUserMessage(text);
  userInput.value = "";
  userInput.style.height = "auto";

  llmMessages.push({ role: "user", content: text });

  chatForm.querySelector("button[type=submit]").disabled = true;
  appendTypingIndicator();

  try {
    const res = await fetch("/api/kochun", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: llmMessages }),
    });

    removeTypingIndicator();

    if (!res.ok) {
      appendBotMessage(
        "코천 서버에서 오류가 난 것 같아. 잠시 후에 다시 시도해 줄래?"
      );
      chatForm.querySelector("button[type=submit]").disabled = false;
      return;
    }

    const data = await res.json();
    let content =
      data.content || "응답을 제대로 못 받아왔어. 다시 한 번만 말해 줄래?";

    // LLM이 ``` 또는 ```html 같은 코드 블록으로 감싸는 경우 제거
    content = content.replace(/```[a-zA-Z]*\s*/g, "").replace(/```/g, "");

    // 줄바꿈 정규화: CRLF -> LF
    content = content.replace(/\r\n/g, "\n");
    // 여러 개의 연속 줄바꿈은 모두 하나의 줄바꿈으로 축약
    content = content.replace(/\n+/g, "\n");

    llmMessages.push({ role: "assistant", content });

    // 최종적으로 한 번의 개행마다 <br /> 하나만 사용 (빈 줄 추가 없음)
    const html = content.replace(/\n/g, "<br />");

    appendBotMessage(html);
  } catch (e) {
    removeTypingIndicator();
    appendBotMessage(
      "코천이 지금 잠깐 네트워크 정비 중이야. 터미널에서 서버가 잘 켜져 있는지 한 번만 확인해 줄래?"
    );
  } finally {
    chatForm.querySelector("button[type=submit]").disabled = false;
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleUserMessage(userInput.value);
});

userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = userInput.scrollHeight + "px";
});

window.addEventListener("DOMContentLoaded", () => {
  appendBotMessage(`
    안녕! 나는 코딩천재 <strong>코천</strong>이야.<br />
    <strong>코딩 자율학습단에 참여하기로 한 거, 진짜 잘한 선택이야!</strong> 앞으로는 코천이 옆에서 같이 도와줄게.<br />
    <br />
    요즘 코딩이나 AI 관련해서 <strong>뭐가 제일 궁금한지, 뭘 해보고 싶은지</strong> 솔직하게 적어줘.<br />
    <br />
    예를 들면 이렇게 말해도 좋아:<br />
    · &ldquo;코딩은 완전 처음인데, 뭐부터 시작해야 할지 모르겠어.&rdquo;<br />
    · &ldquo;웹 서비스를 하나 만들어 보고 싶은데 뭐부터 볼까?&rdquo;<br />
    · &ldquo;회사 업무를 좀 더 똑똑하게 처리해보고 싶어.&rdquo;<br />
    <br />
    네 얘기 듣고, 코천이 서점에서라면 뭐를 집어 들 것 같은지 골라줄게!
  `);
});

