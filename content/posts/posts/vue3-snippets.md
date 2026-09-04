---
title: Vue3 + Element Plus 常用代码片段
description: 收录 Vue3 与 Element Plus 开发中的常用代码片段，包括 el-table 序号、el-upload 图片上传、动态表单校验、flv.js 视频播放等。
date: 2025-01-25
updated: 2025-01-25
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [开发]
tags: [Vue3, Element Plus, el-table, el-upload, el-form, FLV]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## 一、el-table 添加序号

在 `el-table` 中添加从 1 开始的序号列，支持分页连续编号。

**template：**

```html
<el-table-column label="序号" align="center" type="index" :index="indexMethod"/>
```

**script：**

```js
indexMethod(index) {
  let pageNum = this.queryParams.pageNum - 1;
  if ((pageNum !== -1 && pageNum !== 0)) {
    return (index + 1) + (pageNum * this.queryParams.pageSize);
  } else {
    return (index + 1)
  }
},
```

## 二、el-upload 上传图片

使用 `el-upload` 组件实现图片上传、格式校验与回显。

**template：**

```html
<el-form-item label="现场照片" prop="urls">
  <el-upload
    v-model:file-list="imgFileList1"
    :action="action"
    :headers="imgToken"
    :on-success="handleSuccess1"
    list-type="picture-card"
    :before-upload="beforeAvatarUpload"
    :on-preview="handlePictureCardPreview"
    :on-remove="handleRemove1"
  >
    <el-icon>
      <Plus />
    </el-icon>
  </el-upload>
</el-form-item>
```

**data：**

```js
imgFileList1: [],
imgFileListForm: [],
piclist1: [],
imgToken: {
  'Blade-Auth': 'Bearer ' + JSON.parse(localStorage.getItem('saber-token')).content
},
limitImg: 10,
action: `/api/blade-resource/oss/endpoint/put-file`,
disabled: false,
dialogImageUrl: '',
dialogVisible: false
```

**methods：**

```js
beforeAvatarUpload(file) {
  const imgType = file.type === 'image/jpeg' || file.type === 'image/png';
  const imgSize = file.size / 1024 / 1024 < 5;
  if (!imgType) {
    this.$utils.toast('图片只能是 JPG/PNG 格式!', 'error');
  }
  if (!imgSize) {
    this.$utils.toast('图片大小不能超过 5MB!', 'error');
  }
  return imgType && imgSize;
},

handlePictureCardPreview(uploadFile) {
  this.dialogImageUrl = uploadFile.url;
  this.dialogVisible = true;
},

handleRemove1(res) {
  let index = this.imgFileListForm.findIndex(e => e === res.url);
  this.imgFileListForm.splice(index, 1);
},

handleSuccess1(res) {
  if (res.code === 200) {
    this.imgFileListForm.push(res.data.link);
  }
},
```

**图片回显：**

```js
if (this.form.images) {
  this.form.images.forEach(value => {
    this.imgFileList1.push({ url: value });
  });
}
```

## 三、动态添加输入框并校验

利用 Vue3 响应式能力，在 `el-table` 中动态添加输入框并实现实时校验。

```html
<template>
  <div>
    <el-form :model="info" ref="forms">
      <el-table ref="tableRef" :data="info.data" border>
        <el-table-column align="center" property="name" label="*姓名">
          <template #default="row">
            <el-form-item :prop="'data.' + row.$index + '.name'" :rules="formRules.name">
              <el-input placeholder="请输入姓名" v-model="info.data[row.$index].name" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column align="center" property="role" label="角色">
          <template #default="row">
            <el-form-item :prop="'data.' + row.$index + '.role'" :rules="formRules.role">
              <el-input placeholder="请输入角色" v-model="info.data[row.$index].role" />
            </el-form-item>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <el-button type="primary" @click="submitForm()">Submit</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance } from 'element-plus'

let info: any = reactive({
  data: [
    { id: 0, name: '', role: '' },
    { id: 1, name: '', role: '' }
  ]
})

const formRules = reactive({
  name: [{ required: true, message: '请输入姓名', trigger: 'change' }],
  role: [{ required: true, message: '请输入角色', trigger: 'change' }]
})

const forms = ref<FormInstance>()
const submitForm = async () => {
  if (!forms) return
  return await forms.value?.validate((valid: any) => {
    if (valid) {
      console.log('submit!')
    } else {
      console.log('error submit!')
      return false
    }
  })
}
</script>
```

## 四、flv.js 播放 FLV 视频流

在 Vue3 中使用 `flv.js` 播放 HTTP-FLV 在线视频流。

```bash
npm install vue flv.js --save
```


```html
<template>
  <div>
    <video ref="videoPlayer" controls width="640" height="360"></video>
  </div>
</template>

<script>
import flvjs from 'flv.js';

export default {
  data() {
    return {
      flvPlayer: null,
      videoSource: 'http://example.com/live/stream.flv'
    };
  },
  mounted() {
    this.initFlvPlayer();
  },
  beforeDestroy() {
    this.destroyFlvPlayer();
  },
  methods: {
    initFlvPlayer() {
      if (flvjs.isSupported()) {
        const videoPlayer = this.$refs.videoPlayer;
        const flvPlayer = flvjs.createPlayer({
          type: 'flv',
          url: this.videoSource
        });
        flvPlayer.attachMediaElement(videoPlayer);
        flvPlayer.load();
        flvPlayer.play();
        this.flvPlayer = flvPlayer;
      } else {
        console.error('FLV.js is not supported in this browser.');
      }
    },
    destroyFlvPlayer() {
      if (this.flvPlayer) {
        this.flvPlayer.destroy();
      }
    }
  }
};
</script>
```
