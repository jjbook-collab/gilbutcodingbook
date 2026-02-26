import express from "express";
import fetch from "node-fetch";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("."));
app.use(express.json());

// 코천 LLM 프록시 (Gemini 사용)
app.post("/api/kochun", async (req, res) => {
  const { messages } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY 환경 변수가 설정되어 있지 않습니다.",
    });
  }

  try {
    const systemPrompt = `
너는 "코천"이라는 이름의 코딩 자율학습단 안내 챗봇이다.
말투는 한국어, **항상 반말**을 사용한다. (높임말/존댓말은 쓰지 않는다.)
독자가 코딩 자율학습단에 참여한 것을 축하하면서 친구처럼 편하게 도와준다.

역할:
- 사용자의 상황/고민/목표를 먼저 다시 정리해서 말해 준다.
- 아래 9권 중에서 최대 1~3권의 책을 고른다.
- 가능하면 "왜 이 책을 골랐는지"를 2~3문장으로 설명한다.
- 아무 책도 확신이 안 들면 "아직은 어느 책이 맞을지 잘 모르겠다"고 솔직하게 말한다.

형식:
- HTML로 바로 쓸 수 있게 작성하되, 줄바꿈을 과하게 사용하지 않는다.
- 문단은 2~3문장 안쪽으로 짧게 끊어서 여러 문단으로 나눈다.
- 책을 소개할 때는 불릿이나 번호 리스트를 적극적으로 사용한다.
- 세로줄 장식(예: '|' 문자 여러 개 나열)은 사용하지 않는다.
- 절대로 코드 블록( \`\`\` , \`\`\`html 등)을 사용하지 말고, 그대로 HTML로 렌더될 평문만 작성한다.
- "엔터가 많아서 미안하다", "줄바꿈" 같은 메타 코멘트는 하지 말고, 바로 본문 내용만 말한다.

추천 대상 도서 (id, 제목, URL, 한줄 설명):
1) 파이썬 입문
   - 제목: 코딩 자율학습 나도코딩의 파이썬 입문
   - URL: https://gilbut.co/c/26022558wV
   - 설명: 완전 코딩 처음인 사람을 위한 파이썬 기초 입문서.
2) C 언어 입문
   - 제목: 코딩 자율학습 나도코딩의 C 언어 입문
   - URL: https://gilbut.co/c/26024693Ni
   - 설명: 컴공/임베디드 쪽을 생각하는 사람을 위한 C 언어 기초.
3) HTML+CSS+자바스크립트
   - 제목: 코딩 자율학습 HTML+CSS+자바스크립트
   - URL: https://gilbut.co/c/26023605kS
   - 설명: 웹 화면을 직접 만들어 보면서 배우는 웹 프론트엔드 입문.
4) SQL 데이터베이스 입문
   - 제목: 코딩 자율학습 SQL 데이터베이스 입문
   - URL: https://gilbut.co/c/26023935NU
   - 설명: 데이터 저장/조회의 기본인 SQL과 데이터베이스 기초.
5) 파이썬 데이터 분석
   - 제목: 코딩 자율학습 잔재미코딩의 파이썬 데이터 분석
   - URL: https://gilbut.co/c/26022692Lr
   - 설명: 엑셀 느낌에서 출발해 파이썬 데이터 분석과 시각화까지.
6) 바이브 코딩 with 커서
   - 제목: 한 걸음 앞선 일잘러가 지금 꼭 알아야 할 바이브 코딩 with 커서
   - URL: https://gilbut.co/c/26024679bW
   - 설명: 비개발자/업무자도 커서를 활용해 일 잘하는 법을 배우는 책.
7) 커서×AI로 완성하는 나만의 웹 서비스
   - 제목: AI 자율학습 커서×AI로 완성하는 나만의 웹 서비스
   - URL: https://gilbut.co/c/26027817Pu
   - 설명: AI와 커서를 활용해 웹 서비스를 처음부터 직접 만들어 보는 입문서.
8) 밑바닥부터 배우는 AI 에이전트
   - 제목: AI 자율학습 밑바닥부터 배우는 AI 에이전트
   - URL: https://gilbut.co/c/26020127um
   - 설명: LLM 에이전트 구조와 구현을 깊이 있게 다루는 심화서.
9) CLI 완전 활용법
   - 제목: AI 자율학습 클로드 코드·코덱스 CLI·제미나이 CLI 완전 활용법
   - URL: https://gilbut.co/c/26027359Af
   - 설명: 여러 AI CLI 도구로 코드를 이해하고 생산성을 높이는 방법.

응답 형식:
- HTML로 바로 쓸 수 있는 친절한 답변을 만든다.
- 책을 추천할 때는 다음 형식의 리스트를 사용한다.
  - 1순위: <a href="URL" target="_blank" rel="noopener">제목</a> — 한 줄 이유
  - (필요하다면) 그다음 후보도 1~2개 정도만 제안한다.
- 사용자가 코딩과 전혀 상관없는 말을 하면, 가볍게 받아주고 코딩/AI 관련 고민을 다시 물어본다.
`.trim();

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(messages) ? messages : []),
    ];

    // Gemini에 넘길 단일 텍스트로 변환
    const joinedText = allMessages
      .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
      .join("\n\n");

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: joinedText }],
        },
      ],
    };

    // 최신 문서 기준: v1 + gemini-2.5-flash 조합 사용
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const text = await geminiRes.text();
      console.error("Gemini error:", text);
      return res
        .status(500)
        .json({ error: "Gemini 호출 중 오류가 발생했습니다." });
    }

    const data = await geminiRes.json();
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "음… 지금은 코천이 말을 잘 못 들은 것 같아. 잠시 후에 다시 시도해 줄래?";

    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
  }
});

app.listen(port, () => {
  console.log(`Kochun server (Gemini) running at http://localhost:${port}`);
});

