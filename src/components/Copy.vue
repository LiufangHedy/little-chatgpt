<template>
  <div class="cursor container" @click="copyToClipboard()">
    <Copy
      v-show="btnStatus === 'copy'"
      :size="btnConfig.size"
      :theme="btnConfig.theme"
      :fill="btnConfig.fill"
    />
    <Loading
      class="rotate"
      v-show="btnStatus === 'loading'"
      :size="btnConfig.size"
      :theme="btnConfig.theme"
      :fill="btnConfig.fill"
    />
    <check-one
      v-show="btnStatus === 'success'"
      :size="btnConfig.size"
      :theme="btnConfig.theme"
      :fill="btnConfig.fill"
    />
    <close-one
      v-show="btnStatus === 'error'"
      :size="btnConfig.size"
      :theme="btnConfig.theme"
      :fill="btnConfig.fill"
    />
    <span class="fontSize">{{ btnTips[btnStatus] }}</span>
  </div>
</template>
<script setup lang="ts">
import { Copy, Loading, CheckOne } from "@icon-park/vue-next";
import type { Theme } from "@icon-park/vue-next/lib/runtime";
import { log } from "console";
import { ref } from "vue";

console.log("copy: ", Copy);
console.log("Loading: ", Loading);
console.log("CheckOne: ", CheckOne);

const props = defineProps<{ content: string }>();
const btnConfig: {
  size: number;
  theme: Theme;
  fill: string;
} = {
  size: 14,
  theme: "outline",
  fill: "#999",
};
const btnTips = {
  copy: "复制全文",
  loading: "",
  success: "已复制到粘贴板",
  error: "复制失败!",
};
let btnStatus = ref<"copy" | "loading" | "success" | "error">("copy");
function copyToClipboard(content: string = props.content) {
  btnStatus.value = "loading";
  //   复制文本
  navigator.clipboard
    .writeText(content)
    .then((res) => {
      console.log("copied: ", res);
      setTimeout(() => (btnStatus.value = "success"), 150);
    })
    .catch((err) => {
      console.log("copy failed: ", err);
      btnStatus.value = "error";
    })
    .finally(() => {
      setTimeout(() => (btnStatus.value = "copy"), 2000);
    });
}
</script>
<style scoped>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.rotate {
  animation: spin 2s linear infinite;
}
.container {
  /* line-height: 1rem;  */
  display: flex;
  align-items: center;
  justify-content: right;
}
.cursor {
  cursor: pointer;
}
.fontSize {
  font-size: 0.75rem;
  line-height: 1rem;
  color: #6b7280;
}
</style>