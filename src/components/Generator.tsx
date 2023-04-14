import { Index, Show, createSignal, onCleanup, onMount } from "solid-js";
import { useThrottleFn } from "solidjs-use";
import { generateSignature } from "@/utils/auth";
import IconClear from "./icons/Clear";
import IconVoice from "./icons/Voice";
import MessageItem from "./MessageItem";
import SystemRoleSettings from "./SystemRoleSettings";
import ErrorMessageItem from "./ErrorMessageItem";
import type { ChatMessage, ErrorMessage } from "@/types";

class ACNode {
  constructor() {
    this.children = new Map();
    this.fail = null;
    this.isEnd = false;
    this.type = null;
  }
}
export class AhoCorasick {
  constructor() {
    this.root = new ACNode();
    this.types = ["sexual", "terror", "political", "live", "corrupt"];
  }
  addWord(word, type) {
    let currentNode = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!currentNode.children.has(char))
        currentNode.children.set(char, new ACNode());
      currentNode = currentNode.children.get(char);
    }
    currentNode.isEnd = true;
    currentNode.type = type;
  }
  buildFailurePointer() {
    let queue = [];
    this.root.fail = this.root;
    for (let child of this.root.children.values()) {
      child.fail = this.root;
      queue.push(child);
    }
    while (queue.length > 0) {
      let currentNode = queue.shift();
      for (let [char, child] of currentNode.children) {
        queue.push(child);
        let failNode = currentNode.fail;
        while (failNode !== this.root && !failNode.children.has(char)) {
          failNode = failNode.fail;
        }
        if (failNode.children.has(char)) {
          child.fail = failNode.children.get(char);
        } else {
          child.fail = this.root;
        }
      }
    }
  }
  search(text) {
    let currentNode = this.root;
    let results = new Set();
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      while (currentNode !== this.root && !currentNode.children.has(char))
        currentNode = currentNode.fail;
      if (currentNode.children.has(char))
        currentNode = currentNode.children.get(char);
      if (currentNode.isEnd) results.add(currentNode.type);
    }
    return results;
  }
  detect(text) {
    text = text.toLocaleLowerCase();
    let result = {
      hasSensitiveWords: false,
      types: [],
    };
    let typesSet = this.search(text);
    if (typesSet.size > 0) {
      result.hasSensitiveWords = true;
      typesSet.forEach((type) => {
        result.types.push(type);
      });
    }
    return result;
  }
}

// 创建AC自动机实例
let ac = new AhoCorasick();

// 添加敏感词汇
const sensitiveWords = {
  sexual: [
    "Massage stick",
    "Popping grass",
    "Violent rape",
    "Exposed breasts",
    "Breastburst",
    "Violent sex",
    "Get fucked",
    "Get fucked",
    "Forced rape",
    "Insert violence",
    "Manipulate",
    "Fuck black",
    "Fuck it",
    "Fuck you",
    "Fuck me",
    "Toilet slave",
    "Interpolation ratio",
    "Tide blowing",
    "Tide spray",
    "Adult movies",
    "Adult forum",
    "Adult pornography",
    "Adult websites",
    "Adult literature",
    "Adult novels",
    "Erotic novels",
    "Adult games",
    "Eat essence",
    "Plugging",
    "An aphrodisiac",
    "Pumping vigorously",
    "Big breasts",
    "Slut",
    "Chasing women",
    "Pirates",
    "Make waves",
    "Piss",
    "Powder hole",
    "Romantic continent",
    "Fuck you",
    "Dry point",
    "Anal sex",
    "Glans penis",
    "Wrapped book",
    "Domestic av",
    "So tender",
    "Black force",
    "Backcourt",
    "Back point",
    "Tiger riding",
    "Wife swap club",
    "Pornography",
    "Chicken bar",
    "Dick",
    "Sodom",
    "Prostitutes",
    "Adultery",
    "Semen",
    "Big dick",
    "Chrysanthemum cave",
    "Jumen",
    "Giant milk",
    "Big breasts",
    "Mouth explosion",
    "Oral work",
    "Oral shot",
    "Oral sex",
    "Panties",
    "Crazy exercise",
    "Wild insertion",
    "Rapunzel",
    "Prodigal girl",
    "Leaking milk",
    "Promiscuity",
    "Incest",
    "Wheel violence",
    "Rotation exercise",
    "Gang rape",
    "Naked company",
    "Secret lips",
    "Rape",
    "Dense cave",
    "Honey cave",
    "Touch the milk",
    "Touch your chest",
    "Mother rape",
    "Breasts",
    "Male slave",
    "Inject",
    "Tender",
    "Tender girl",
    "Tender point",
    "Pinch",
    "Sex friends",
    "Sex friends",
    "Spray sperm",
    "Protruding forward and backward",
    "Rape",
    "Rape a virgin",
    "Sex toys",
    "Erotic",
    "Naked",
    "Group sex",
    "Man and beast",
    "It's rotten",
    "Meat sticks",
    "Meat force",
    "Meat lips",
    "Meat hole",
    "Meat seam",
    "Meat stick",
    "Flesh stem",
    "Meat utensils",
    "Knead milk",
    "Pork point",
    "Lust",
    "Breastburst",
    "Breast",
    "Cleavage",
    "Lactation",
    "Nipples",
    "Sao bi",
    "A slut",
    "Sao shui",
    "Sao point",
    "Pornographic websites",
    "Color zone",
    "Seduce",
    "Lust",
    "Young abin",
    "Shoot cool",
    "Shoot the face",
    "Eating essence",
    "Release desire",
    "Animal rape",
    "Animal sex",
    "Masturbation",
    "Animal lust",
    "Cool film",
    "Double hips",
    "Silk stockings",
    "Silk lure",
    "Kaede Matsushima",
    "Crispy and itchy",
    "Tang Jiali",
    "Physical rape",
    "Push oil",
    "Take off your underwear",
    "Dancers",
    "Without correction",
    "Suction",
    "Jun Natsukawa",
  ],
  terror: [
    "stun gun",
    "Electric chicken",
    "Electric police stick",
    "Gun sale",
    "Gun system",
    "Gun arrival",
    "Shoot a female prisoner",
    "Gun model",
    "opium",
    "A furong",
    "cocain",
    "Triazolam",
    "methadone",
    "K powder",
    "Ketamine",
    "ketamine",
    "amphetamine",
    "cannabis",
    "hemp",
  ],
  political: [
    "Police bandits",
    "Official bandits",
    "autocrat and traitor to the people",
    "collusion between government officials and business owners",
    "redress",
    "Taiwan independence",
    "Tibet Independence",
    "Muslim",
  ],
  live: [
    "Suicide",
    "Surrogate",
    "Drug substitute drugs: plasma",
    "usury",
    "heroin",
  ],
  corrupt: [
    "corruption",
    "Communist autocracy",
    "Chinese empire",
    "neglect of duty",
  ],
};

for (let type in sensitiveWords) {
  for (let word of sensitiveWords[type]) {
    ac.addWord(word.toLocaleLowerCase(), type);
  }
}

// 构建AC自动机树
ac.buildFailurePointer();

//   // 测试
//   let text = "stun gun Police bandits";
//   let result = ac.detect(text);
//   console.log(result);
//   // 输出：{ hasSensitiveWords: true, types: [ 'sexual', 'Political sensitive content' ] }

//   text = "Massage stick";
//   result = ac.detect(text);
//   console.log(result);
//   // 输出：{ hasSensitiveWords: true, types: [ 'terror' ] }

//   text = "corruption";
//   result = ac.detect(text);
//   console.log(result);
//   // 输出：{ hasSensitiveWords: true, types: [ 'corrupt' ] }

//   text = "a report about livehood";
//   result = ac.detect(text);
//   console.log(result);
// 输出：{ hasSensitiveWords: false, types: [] }F

export default () => {
  let inputRef: HTMLTextAreaElement;
  const [currentSystemRoleSettings, setCurrentSystemRoleSettings] =
    createSignal("");
  const [systemRoleEditing, setSystemRoleEditing] = createSignal(false);
  const [messageList, setMessageList] = createSignal<ChatMessage[]>([]);
  const [currentError, setCurrentError] = createSignal<ErrorMessage>();
  const [currentAssistantMessage, setCurrentAssistantMessage] =
    createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [controller, setController] = createSignal<AbortController>(null);

  onMount(() => {
    try {
      if (localStorage.getItem("messageList"))
        setMessageList(JSON.parse(localStorage.getItem("messageList")));

      if (localStorage.getItem("systemRoleSettings"))
        setCurrentSystemRoleSettings(
          localStorage.getItem("systemRoleSettings")
        );
    } catch (err) {
      console.error(err);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    onCleanup(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    });
  });

  const handleBeforeUnload = () => {
    localStorage.setItem("messageList", JSON.stringify(messageList()));
    localStorage.setItem("systemRoleSettings", currentSystemRoleSettings());
  };

  function insertAfter(newElement, targetElement) {
    var parent = targetElement.parentNode;
    if (parent.lastChild == targetElement) {
      parent.appendChild(newElement);
    } else {
      parent.insertBefore(newElement, targetElement.nextSibling);
    }
  }

  const handleButtonClick = async () => {
    const inputValue = inputRef.value;
    if (!inputValue) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (window?.umami) umami.trackEvent("chat_generate");
    inputRef.value = "";
    setMessageList([
      ...messageList(),
      {
        role: "user",
        content: inputValue,
      },
    ]);
    console.log(window.speechSynthesis.getVoices());

    if (ac.detect(inputValue).hasSensitiveWords) {
    //   alert()
      let words = document.querySelectorAll(".word");
      let targetElement = words[words.length - 1];
      let newElement = document.createElement("div");
      let answers = {
        sexual:
          "I believe that you are an innocent child, so you should not say such sexually suggestive words.😥",
        terror:
          "Dear child, you will grow up healthier if you stay away from terror and violence.😁",
        political:
          "Your language involves sensitive political topics, and I am just your oral English training teacher, so I can't answer those kind of questions.✒️",
        live: "Don't do it, you have a promising future!😭",
        corrupt:
          "Corrupion is a complex topic which is not suitable for the kid like you, just ignore it!😪",
      };
      for (let type of ac.detect(inputValue).types) {
        newElement.className = "my-4 px-4 py-3 border border-red/50 bg-red/10";
        newElement.innerHTML = `<!--#--><div class="text-red mb-1">${type} Problem</div><!--/--><div class="text-red op-70 text-sm">${answers[type]}</div><!--#--><div class="fie px-3 mb-2"></div><!--/-->`;
        insertAfter(newElement, targetElement);
      }

      // console.log(document.querySelector(''))
      // <div class="my-4 px-4 py-3 border border-red/50 bg-red/10"><!--#--><div class="text-red mb-1">TypeError</div><!--/--><div class="text-red op-70 text-sm">fetch failed</div><!--#--><div class="fie px-3 mb-2"><div class="gpt-retry-btn border-red/50 text-red"><!--#--><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32"><path d="M25.95 7.65l.005-.004c-.092-.11-.197-.206-.293-.312c-.184-.205-.367-.41-.563-.603c-.139-.136-.286-.262-.43-.391c-.183-.165-.366-.329-.558-.482c-.16-.128-.325-.247-.49-.367c-.192-.14-.385-.277-.585-.406a13.513 13.513 0 0 0-.533-.324q-.308-.179-.625-.341c-.184-.094-.37-.185-.56-.27c-.222-.1-.449-.191-.678-.28c-.19-.072-.378-.145-.571-.208c-.246-.082-.498-.15-.75-.217c-.186-.049-.368-.102-.556-.143c-.29-.063-.587-.107-.883-.15c-.16-.023-.315-.056-.476-.073A12.933 12.933 0 0 0 6 7.703V4H4v8h8v-2H6.811A10.961 10.961 0 0 1 16 5a11.111 11.111 0 0 1 1.189.067c.136.015.268.042.403.061c.25.037.501.075.746.128c.16.035.315.08.472.121c.213.057.425.114.633.183c.164.054.325.116.486.178c.193.074.384.15.57.235c.162.072.32.15.477.23q.268.136.526.286c.153.09.305.18.453.276c.168.11.33.224.492.342c.14.102.282.203.417.312c.162.13.316.268.47.406c.123.11.248.217.365.332c.167.164.323.338.479.512A10.993 10.993 0 1 1 5 16H3a13 13 0 1 0 22.95-8.35z" fill="currentColor"></path></svg><!--/--><span>Regenerate</span></div></div><!--/--></div>
      // throw new Error('Bad words')
    } else {
      requestWithLatestMessage();
    }
  };

  const smoothToBottom = useThrottleFn(
    () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    },
    300,
    false,
    true
  );

  const requestWithLatestMessage = async () => {
    setLoading(true);
    setCurrentAssistantMessage("");
    setCurrentError(null);
    const storagePassword = localStorage.getItem("pass");
    try {
      const controller = new AbortController();
      setController(controller);
      const requestMessageList = [...messageList()];
      if (currentSystemRoleSettings()) {
        requestMessageList.unshift({
          role: "system",
          content: currentSystemRoleSettings(),
        });
      }
      const timestamp = Date.now();
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          messages: requestMessageList,
          time: timestamp,
          pass: storagePassword,
          sign: await generateSignature({
            t: timestamp,
            m:
              requestMessageList?.[requestMessageList.length - 1]?.content ||
              "",
          }),
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = await response.json();
        console.error(error.error);
        setCurrentError(error.error);
        throw new Error("Request failed");
      }
      const data = response.body;
      if (!data) throw new Error("No data");

      const reader = data.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let tempWords = "";
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) {
          const char = decoder.decode(value);
          if (char === "x\n" && currentAssistantMessage().endsWith("\n"))
            continue;

          if (char) {
            tempWords += char;
            if (
              char.endsWith(",") ||
              char.endsWith(".") ||
              char.endsWith("?") ||
              char.endsWith("!")
            ) {
              let utterance = new SpeechSynthesisUtterance(tempWords);
              console.log(speechSynthesis.getVoices());
              utterance.lang = "";
              console.log(tempWords)
            //   window.speechSynthesis.cancel();
              speechSynthesis.speak(utterance);
              tempWords = "";
            }
            setCurrentAssistantMessage(currentAssistantMessage() + char);
          }
          smoothToBottom();
        }
        done = readerDone;
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setController(null);
      return;
    }
    archiveCurrentMessage();
  };

  const archiveCurrentMessage = () => {
    if (currentAssistantMessage()) {
      setMessageList([
        ...messageList(),
        {
          role: "assistant",
          content: currentAssistantMessage(),
        },
      ]);
      setCurrentAssistantMessage("");
      setLoading(false);
      setController(null);
      inputRef.focus();
    }
  };

  const clear = () => {
    inputRef.value = "";
    inputRef.style.height = "auto";
    setMessageList([]);
    setCurrentAssistantMessage("");
    setCurrentError(null);
  };

  const voice = () => {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = window.navigator.language || "en-US"; // 设置为语言
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      document.querySelector(".gen-textarea").textContent =
        result[0].transcript;
      setTimeout(() => {
        console.log(result[0].transcript);
        handleButtonClick();
      }, 500);
    };
    recognition.start(); // 开始语音识别
    setTimeout(() => {
      recognition.stop(); // 停止语音识别
    }, 10000);
  };

  const stopStreamFetch = () => {
    if (controller()) {
      controller().abort();
      archiveCurrentMessage();
    }
  };

  const retryLastFetch = () => {
    if (messageList().length > 0) {
      const lastMessage = messageList()[messageList().length - 1];
      if (lastMessage.role === "assistant")
        setMessageList(messageList().slice(0, -1));
      requestWithLatestMessage();
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.shiftKey) return;

    if (e.keyCode === 13) {
      e.preventDefault();
      handleButtonClick();
    }
  };

  return (
    <div my-6>
      <SystemRoleSettings
        canEdit={() => messageList().length === 0}
        systemRoleEditing={systemRoleEditing}
        setSystemRoleEditing={setSystemRoleEditing}
        currentSystemRoleSettings={currentSystemRoleSettings}
        setCurrentSystemRoleSettings={setCurrentSystemRoleSettings}
      />
      <Index each={messageList()}>
        {(message, index) => (
          <MessageItem
            role={message().role}
            message={message().content}
            showRetry={() =>
              message().role === "assistant" &&
              index === messageList().length - 1
            }
            onRetry={retryLastFetch}
          />
        )}
      </Index>
      {currentAssistantMessage() && (
        <MessageItem role="assistant" message={currentAssistantMessage} />
      )}
      {currentError() && (
        <ErrorMessageItem data={currentError()} onRetry={retryLastFetch} />
      )}
      <Show
        when={!loading()}
        fallback={() => (
          <div class="gen-cb-wrapper">
            <span>Waiting for the response from teacher...</span>
            <div class="gen-cb-stop" onClick={stopStreamFetch}>
              Stop
            </div>
          </div>
        )}
      >
        <div class="gen-text-wrapper" class:op-50={systemRoleEditing()}>
          <textarea
            ref={inputRef!}
            disabled={systemRoleEditing()}
            onKeyDown={handleKeydown}
            placeholder="Say something..."
            autocomplete="off"
            autofocus
            onInput={() => {
              inputRef.style.height = "auto";
              inputRef.style.height = `${inputRef.scrollHeight}px`;
            }}
            rows="1"
            class="gen-textarea"
          />
          <button
            onClick={handleButtonClick}
            disabled={systemRoleEditing()}
            gen-slate-btn
          >
            Send
          </button>
          <button
            title="Voice"
            onClick={voice}
            disabled={systemRoleEditing()}
            gen-slate-btn
          >
            <IconVoice />
          </button>
          <button
            title="Clear"
            onClick={clear}
            disabled={systemRoleEditing()}
            gen-slate-btn
          >
            <IconClear />
          </button>
        </div>
      </Show>
    </div>
  );
};
