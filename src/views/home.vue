<template>
  <div class="container">
    <header class="header">
      <div>
        <h2>ChatGPT</h2>
        <span class="intro fontSize"
          >基于 OpenAI 的 ChatGPT 自然语言模型人工智能对话</span
        >
      </div>
      <button class="fontSize" @click="toConfig()">设置</button>
    </header>
    <div class="main" ref="chatListDOM">
      <div v-for="msg in messageListComputed" class="msgBox">
        <div class="msgRole">
          <div class="fontBold">{{ roleAlias[msg.role] }}:</div>
          <!-- copy组件 -->
          <my-copy class="copy" :content="msg.content"></my-copy>
        </div>
        <div>
          <div
            v-if="msg.content"
            v-html="md.render(msg.content)"
            class="msgContent fontSize"
          ></div>
          <!-- loding组件 -->
          <my-loading v-else></my-loading>
        </div>
      </div>
    </div>
    <footer class="footer">
      <div v-if="isConfig" class="fontSize">请输入API Key：</div>
      <div class="prompt">
        <input
          :type="isConfig ? 'password' : 'text'"
          :placeholder="isConfig ? 'sk-xxxxxxxxxx' : '请输入'"
          v-model="messageContent"
          @keydown.enter="isTalking || sendOrSave()"
        />
        <button class="btn" @click="sendOrSave()">
          {{ isConfig ? "保存" : "发送" }}
        </button>
      </div>
    </footer>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from "vue";
import cryptoJS from "crypto-js";
import { ChatMessage } from "@/types/gpt";
import { chat } from "@/libs/gpt";
import { md } from "@/libs/markdown";
import myLoading from "@/components/Loading.vue";
import MyCopy from "@/components/Copy.vue";

let apiKey = "";
const roleAlias = { user: "ME", assistant: "ChatGPT", system: "System" };
let isConfig = ref(true);
let isTalking = ref(false);
// console.log(isConfig);
let messageContent = ref("");
const decoder = new TextDecoder("utf-8");

let chatListDOM = ref<HTMLDivElement>();
let messageList = ref<ChatMessage[]>([
  {
    role: "system",
    content: "你是 ChatGPT，OpenAI 训练的大型语言模型，尽可能简洁地回答。",
  },
  {
    role: "assistant",
    content: `你好，我是AI语言模型，我可以提供一些常用服务和信息，例如：

1. 翻译：我可以把中文翻译成英文，英文翻译成中文，还有其他一些语言翻译，比如法语、日语、西班牙语等。

2. 咨询服务：如果你有任何问题需要咨询，例如健康、法律、投资等方面，我可以尽可能为你提供帮助。

3. 闲聊：如果你感到寂寞或无聊，我们可以聊一些有趣的话题，以减轻你的压力。

请告诉我你需要哪方面的帮助，我会根据你的需求给你提供相应的信息和建议。`,
  },
]);
let messageListComputed = computed(() =>
  messageList.value.filter((msg) => msg.role !== "system")
);

onMounted(() => {
  // console.log("in mounted");

  if (getAPIKey()) {
    changeConfigStatus();
  }
});

// save apikey or send prompt
function sendOrSave() {
  if (!messageContent.value) return;
  const messageContentTrim = messageContent.value.trim();
  if (isConfig.value) {
    // save apiKey
    if (saveAPIKey(messageContentTrim)) {
      changeConfigStatus();
    }
    clearMessageContent();
  } else {
    sendChatMessage();
  }
}
function sendChatMessage(content: string = messageContent.value) {
  isTalking.value = true;
  if (messageList.value.length === 2) {
    messageList.value.pop();
  }
  messageList.value.push({
    role: "user",
    content,
  });
  clearMessageContent();
  messageList.value.push({
    role: "assistant",
    content: "",
  });
  //   calls the chatgpt api
  chat(messageList.value, getAPIKey())
    .then(async ({ body, status }) => {
      // 无论请求是否成功，都会返回一个结果，所以要判断状态码是否是200
      // console.log("chatgpt returns the result: ", body, status);
      if (body) {
        const reader = body.getReader();
        // console.log("readerrrrr: ", reader, body);
        await readStream(reader, status);
        // console.log("chatList: ", chatListDOM.value);
      }
    })
    .catch((err) => {
      // console.log("chatgpt error: ", err);
      appendLastMessageContent(err);
    })
    .finally(() => {
      isTalking.value = false;
    });
}
// 读取chatgpt接口返回的内容
async function readStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  status: number
) {
  let partialLine = "";

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const { value, done } = await reader.read();
    // console.log("valueeee: ", value, "doneeee: ", done);

    if (done) break;

    const decodedText = decoder.decode(value, { stream: true });
    // console.log("decodedText: ", decodedText);
    if (status !== 200) {
      const json = JSON.parse(decodedText); // start with "data: "
      const content = json.error.message ?? decodedText;
      appendLastMessageContent(content);
      return;
    }

    const chunk = partialLine + decodedText;
    // console.log("chunk: ", chunk);

    const newLines = chunk.split(/\r?\n/);

    partialLine = newLines.pop() ?? "";

    for (const line of newLines) {
      if (line.length === 0) continue; // ignore empty message
      if (line.startsWith(":")) continue; // ignore sse comment message
      if (line === "data: [DONE]") return; //

      const json = JSON.parse(line.substring(6)); // start with "data: "
      const content =
        status === 200
          ? json.choices[0].delta.content ?? ""
          : json.error.message;
      //   console.log("content: ", content);

      appendLastMessageContent(content);
    }
  }
}
watch(messageList.value, () => nextTick(() => scrollToBottom()));
function scrollToBottom() {
  if (!chatListDOM.value) return;
  scrollTo(0, chatListDOM.value.scrollHeight);
}
function appendLastMessageContent(content: string) {
  messageList.value[messageList.value.length - 1].content += content;
}
function saveAPIKey(apiKey: string) {
  if (apiKey.slice(0, 3) !== "sk-" || apiKey.length !== 51) {
    alert("apiKey 错误，请检查后重新输入");
    return false;
  }
  const aesAPIKey = cryptoJS.AES.encrypt(apiKey, getSecretKey()).toString();
  localStorage.setItem("apiKey", aesAPIKey);
  return true;
}
function getAPIKey() {
  if (apiKey) return apiKey;
  let aesAPIKey = localStorage.getItem("apiKey") ?? "";
  apiKey = cryptoJS.AES.decrypt(aesAPIKey, getSecretKey()).toString(
    cryptoJS.enc.Utf8
  );
  return apiKey;
}
function changeConfigStatus() {
  isConfig.value = !isConfig.value;
}
function clearMessageContent() {
  messageContent.value = "";
}
function toConfig() {
  if (!isConfig.value) {
    messageContent.value = getAPIKey();
  } else {
    clearMessageContent();
  }
  changeConfigStatus();
}

const getSecretKey = () => "hedyfighting!";
</script>
<style scoped>
pre {
  font-family: -apple-system, "Noto Sans", "Helvetica Neue", Helvetica,
    "Nimbus Sans L", Arial, "Liberation Sans", "PingFang SC", "Hiragino Sans GB",
    "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN",
    "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti",
    SimHei, "WenQuanYi Zen Hei Sharp", sans-serif;
}
.container {
  box-sizing: border-box;
  height: 100%;
  width: 100%;
}
.header {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  line-height: 3rem;
  height: 5rem;
  padding: 1rem 1.5rem;
  background-color: #f3f4f6;
}
.header h2 {
  display: inline-block;
}
.header .intro {
  color: #6b7280;
  margin-left: 1rem;
}
.header button {
  border-radius: 0.375rem;
  border: none;
  background-color: inherit;
}
.header button:hover {
  background-color: #fff;
  border: 1px solid #fff;
}
.fontSize {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.main {
  margin-top: 6rem;
  margin-bottom: 5rem;
}
.footer {
  position: fixed;
  bottom: 0;
  box-sizing: border-box;
  /* left: 0; */
  width: 100%;
  padding: 1.5rem;
  padding-bottom: 2rem;
  /* height: 4rem; */
  background-color: #f3f4f6;
}
.prompt {
  display: flex;
  box-sizing: border-box;
  box-sizing: border-box;
}
.prompt input {
  flex-grow: 1;
  margin-right: 1rem;
  border-radius: 0.375rem;
  border-width: 1px;
  border-color: transparent;
  padding: 0.5rem 1rem;
  /* border-color: #60a5fa; */
}
.prompt input:focus {
  outline: none; /* 隐藏默认的聚焦边框 */
  border-width: 2px;
  border-color: #60a5fa;
  box-shadow: 0 0 5px rgba(0, 0, 255, 0.3); /* 添加阴影效果 */
}
.prompt .btn {
  width: 4rem;
  background-color: #2563eb;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
}
.fontBold {
  font-weight: 700;
}
.msgBox {
  padding: 0.75rem 1rem;
  /* margin-top: 1rem; */
}
.msgBox:hover {
  border-radius: 0.5rem;
  background-color: #f1f5f9;
}
.msgContent {
  color: #475569;
  max-width: 65ch;
  /* overflow: scroll; */
}
.msgRole {
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.copy {
  /* max-width: 70px; */
}
</style>
