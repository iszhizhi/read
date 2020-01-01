 // 云函数入口文件
 const cloud = require('wx-server-sdk')

 cloud.init({
   env: 'production-ny6ui',
   traceUser: true,
 })
 const db = cloud.database()
 const tcbRouter = require('tcb-router')
 const recommendCollection = cloud.database().collection('recommend')
 const likesCollection = cloud.database().collection('recommendLikes')
 const _ = db.command
 const commentListCollection = cloud.database().collection('recommend-comment')
 
 // 云函数入口函数
 exports.main = async(event, context) => {
   const app = new tcbRouter({
     event
   })
   app.router('recommend', async(ctx, next) => {
     ctx.body = await recommendCollection
       .skip(event.start)
       .limit(event.count)
       .orderBy("createTime",'desc')
       .get()
       .then(res => {
         return res.data
       })
   })
   /**
    * 用户点赞
    */
   app.router('peopleLike', async(ctx, next) => {
     console.log("peopleLike",event)
     const {
       OPENID
     } = cloud.getWXContext()
     await likesCollection.add({
         data: {
           openid: OPENID,
           createTime: db.serverDate(),
           recommendId:event.recommendId
         }
       })
       .then(async(res) => {
         await recommendCollection.doc(event.recommendId).update({
           data: {
             likes: _.inc(1)
           }
         })
       })
   })
   /**
    * 用户取消点赞
    */
   app.router('cancelPeopleLike', async(ctx, next) => {
     console.log(event)
     const {
       OPENID
     } = cloud.getWXContext()
     await likesCollection
       .where({
         openid: OPENID,
         recommendId: event.recommendId
       })
       .remove()
       .then(async res => {
         await recommendCollection.doc(event.recommendId)
           .update({
             data: {
               likes: _.inc(-1)
             }
           })
       })
   })
   app.router('total', async(ctx, next) => {

     ctx.body = await recommendCollection.count()
   })
   /**
    * 获取用户喜欢的推荐
    */
   app.router('getPeopleLike', async(ctx, next) => {
     let arr = []
     const {
       OPENID
     } = cloud.getWXContext()
     //获取用户喜欢的推荐id
     await likesCollection
       .where({
         openid: OPENID
       })
       .orderBy('createTime', "desc")
       .get()
       .then((res) => {
         console.log('res', res)
         for (let i = 0; i < res.data.length; i++) {
           arr.push(res.data[i].recommendId)
         }
       })
     //拿id去换博客
     ctx.body = await recommendCollection.where({
         _id: _.in(arr)
       })
       .skip(event.start)
       .limit(event.count)
       .get()
       .then(res => {

         return res.data
       })
   })
   /**
    * 用户拿id换取推荐的内容
    */
   app.router('idToRecommend', async(ctx, netx) => {
     let detail = await recommendCollection
       .where({
         _id: event.recommendId
       })
       .get()
       .then(res => {
         return res.data
       })
     let commentList = await commentListCollection
       .where({
         recommendId: event.recommendId
       })
       .orderBy('createTime', "desc")
       .get()
       .then((res) => {
         return res.data
       })
     ctx.body = {
       detail,
       commentList,
     }
   })

   return app.serve()
 }