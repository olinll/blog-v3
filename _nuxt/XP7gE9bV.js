import{bn as e}from"./CjtitGm-.js";async function r(t){return e("content",t.path,{fields:["date","title","type"]}).order("date","ASC").where("stem","LIKE","posts/%")}export{r as default};
