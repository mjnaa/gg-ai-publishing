# gg-ai-publishing

경기도 생성형 AI 플랫폼 **통합 퍼블리싱 산출물** 저장소입니다.  
공통 레이아웃을 공유하며, 서비스별(업무지원/법률/행정심판) 화면은 **상위 폴더(`work`, `legal`, `appeal`)** 로 구분합니다.

---

## 1) 네이밍 규칙

- 형식: `[두자리번호]-[기능슬러그][--상태/유형].html`  
  - 예) `12-chat-answer--loading.html`, `13-chat-answer--list.html`
- 케밥 케이스(kebab-case) 사용.
- 상태/유형은 `--`(더블 하이픈)으로 구분: `--loading`, `--list`, `--table`, `--code-quote` 등.
- 번호 대역
  - `00~09` 공통(레이아웃/팝업/로딩)
  - `10~39` 서비스(채팅/폴더/프롬프트/도움말)
  - `40~99` 예비(확장)
- 서비스 폴더: `work`, `legal`, `appeal`  
  - 동일 기능은 세 서비스가 같은 번호를 사용합니다(예: 모두 `10-chat-new.html`).

---

## 2) 디렉터리 구조

```
publishing/
 ├─ assets/
 │  ├─ css/
 │  │  ├─ tokens.css
 │  │  ├─ font.css
 │  │  ├─ base.css
 │  │  ├─ layout.css
 │  │  ├─ components.css
 │  │  ├─ mask_datauri.css
 │  │  └─ font/                     # 폰트 리소스
 │  ├─ js/
 │  │  ├─ layout.js                 # 공통 레이아웃
 │  │  ├─ tooltip.js                # 툴팁
 │  │  ├─ dropdown.js               # 드롭다운 메뉴 (다중옵션목록)
 │  │  ├─ dropdown-choice.js        # 드롭다운 메뉴 (단일선택메뉴)
 │  │  ├─ loader.js                 # 풀스크린 로딩
 │  │  ├─ modal-popup.js            # 모달 팝업
 │  │  ├─ chat-smart.js             # 스마트 도우미
 │  │  ├─ chat-file-uploader.js     # 파일 첨부 칩
 │  │  ├─ chat-textarea.js          # 채팅 입력창 자동 높이
 │  │  ├─ chat-bubble-actions.js    # 채팅 버블 액션 제어
 │  └─ img/
 │     └─ icon/                     # 아이콘만 보관
 ├─ common/
 │  ├─ 00-layout.html               # 공통 레이아웃
 │  ├─ 01-popup.html                # 공통 팝업
 │  └─ 02-loading.html              # 풀스크린 로딩
 ├─ work/
 │  ├─ 10-chat-new.html
 │  ├─ 11-chat-bubble.html
 │  ├─ 12-chat-answer--loading.html
 │  ├─ 13-chat-answer--list.html
 │  ├─ 14-chat-answer--table.html
 │  ├─ 15-chat-answer--code-quote.html
 │  ├─ 16-chat-popup.html
 │  ├─ 20-folder-main.html
 │  ├─ 30-prompt-empty.html
 │  ├─ 31-prompt-list.html
 │  ├─ 32-prompt-popup.html
 │  └─ 40-help.html
 ├─ legal/
 │  ├─ 10-chat-new.html
 │  ├─ 11-chat-bubble.html
 │  ├─ 12-chat-answer--loading.html
 │  ├─ 13-chat-answer--list.html
 │  ├─ 14-chat-answer--table.html
 │  ├─ 15-chat-answer--code-quote.html
 │  ├─ 16-chat-popup.html
 │  └─ 20-folder-main.html
 ├─ appeal/
 │  ├─ 10-chat-new.html
 │  ├─ 11-chat-bubble.html
 │  ├─ 12-chat-answer--loading.html
 │  ├─ 13-chat-answer--list.html
 │  ├─ 14-chat-answer--table.html
 │  ├─ 15-chat-answer--code-quote.html
 │  ├─ 16-chat-popup.html
 │  └─ 20-folder-main.html
 └─ pagelist.html                    # 통합 리스트 허브
```

---

## 담당자
- 디자인/퍼블리싱: **나민정(010-5476-2350)**
