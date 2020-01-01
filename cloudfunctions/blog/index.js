// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'production-ny6ui',
  traceUser: true,
})
let MAX_LIMIT = 3
const TcbRouter = require('tcb-router')
const db = cloud.database()
const blogCollection = db.collection("blog")
const commentListCollection = db.collection("blog-comment")
const likesCollection = db.collection("likes")
const _ = db.command
const userCollection = db.collection('user')
// 云函数入口函数 
exports.main = async(event, context) => {
  const app = new TcbRouter({
    event
  })
  /**
   * 获取最新的博客信息
   */
  app.router('theNewTime', async(ctx, next) => {
    const {
      OPENID
    } = cloud.getWXContext()
    ctx.body = await blogCollection
      .where({
        _openid: OPENID
      })
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        return res.data
      })
  })
  /**
   * 获取博客列表
   */
  app.router("list", async(ctx, next) => {

    //获取单条博客点赞记录

    //模糊搜索
    let keywords = event.keywords
    let w = {}
    if (keywords.trim() != '') {
      w = {
        content: db.RegExp({
          regexp: keywords,
          options: 'i'
        })
      }
    }
    ctx.body = await blogCollection
      .where(w)
      .skip(event.start)
      .limit(event.count)
      .orderBy('createTime', "desc")
      .get()
      .then(async res => {
        for (let i = 0; i < res.data.length; i++) {
          let userOpenId = res.data[i]._openid
          //获取用户学校
          await userCollection
            .where({
              _openid: userOpenId
            })
            .get()
            .then(user => {
              console.log('user', user.data)
              res.data[i].readAllTime = user.data[0].readTime
              res.data[i].school = user.data[0].school
            })
        }

        return res.data
      }).catch(

      )
  })
  /**
   * 获取用户打卡天数
   */
  app.router('allDays', async(ctx, next) => {
    const {
      OPENID
    } = cloud.getWXContext()
    let count = await blogCollection.where({
        _openid: OPENID
      })
      .count()
    let cardDay = await blogCollection
      .where({
        _openid: OPENID
      })
      .skip(0)
      .limit(31)
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        return res.data
      })
    ctx.body = {
      cardDay,
      count
    }
  })
  /**
   * 用户删除个人博客
   */
  app.router('deleta', async(ctx, next) => {
    //删除当前博客
    await blogCollection
      .doc(event.blogId)
      .remove()
      .then(res => {
        //删除当前博客的点赞
        likesCollection
          .doc(event.blogId)
          .remove()
        //删除当前博客的评论
        commentListCollection
          .doc(event.blogId)
          .remove()
      })
  })
  /**
   * 获取博客详情以及评论
   */
  app.router("detail", async(ctx, next) => {
  
    let blogId = event.blogId
    let detail = await blogCollection
      .where({
        _id: blogId
      })
      .get()
      .then(async(res) => {
        let OPENID=res.data[0]._openid
        await userCollection
          .where({
            _openid: OPENID
          })
          .get()
          .then(user => {
            console.log('user', user.data)
            res.data[0].readAllTime = user.data[0].readTime
            res.data[0].school = user.data[0].school
          })
        return res.data
      })
    let commentList = await commentListCollection
      .where({
        blogId
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
  /**
   * 获取博客历史
   */
  app.router("getListByOpenid", async(ctx, next) => {
    let wxContent = cloud.getWXContext()
    ctx.body = await blogCollection
      .where({
        _openid: wxContent.OPENID
      })
      .skip(event.start)
      .limit(event.count)
      .orderBy('createTime', "desc")
      .get()
      .then((res) => {
        return res.data
      })
  })
  /**
   * 获取点赞最多的博客 
   */
  app.router("getHotList", async(ctx, next) => {
    ctx.body = await blogCollection
      .skip(event.start)
      .limit(event.count)
      .orderBy('likes', 'desc')
      .orderBy('createTime', 'desc')
      .get()
      .then(async res => {
        for (let i = 0; i < res.data.length; i++) {
          let userOpenId = res.data[i]._openid
          //获取用户学校
          await userCollection
            .where({
              _openid: userOpenId
            })
            .get()
            .then(user => {
              console.log('user', user.data)
              res.data[i].readAllTime = user.data[0].readTime
              res.data[i].school = user.data[0].school
            })
        }

        return res.data
      }).catch(res => {})
  })
  /**
   * 用户对别人的博客点赞情况
   */
  app.router("peopleLikeList", async(ctx, next) => {
    const {
      OPENID
    } = cloud.getWXContext()

    ctx.body = await likesCollection
      .where({
        _openid: OPENID
      })
      .skip(event.start)
      .limit(event.count)
      .get()
      .then(res => {
        return res.data
      })
  })

  /**
   * 用户点赞，原子自增
   */
  app.router('peopleLike', async(ctx, next) => {
    db.collection('blog')
      .doc(event.blogId)
      .update({
        data: {
          likes: _.inc(1)
        }
      }).then(res => {

      })
  })
  /**
   * 将用户点赞情况插入集合中
   */
  app.router('peopleLikeBlog', async(ctx, next) => {
    const {
      OPENID
    } = cloud.getWXContext()
    await likesCollection.add({
        data: {
          openid: OPENID,
          createTime: db.serverDate(),
          blogId: event.blogId,
        }
      })
      .then(async(res) => {
        await blogCollection.doc(event.blogId).update({
          data: {
            likes: _.inc(1)
          }
        })
      })
  })
  /**
   * 删除用户喜欢
   */
  app.router("deletePeopleLikeBlog", async(ctx, next) => {
    console.log('deleteLike', event)
    const {
      OPENID
    } = cloud.getWXContext()
    await likesCollection
      .where({
        openid: OPENID,
        blogId: event.blogId
      })
      .remove()
      .then(async res => {
        await blogCollection
          .doc(event.blogId)
          .update({
            data: {
              likes: _.inc(-1)
            }
          })
      })

  })
  /**
   * 获取用户喜欢博客
   */
  app.router('getUserLike', async(ctx, next) => {
    let arr = []
    const {
      OPENID
    } = cloud.getWXContext()
    await likesCollection
      .where({
        openid: OPENID
      })
      .orderBy('createTime', "desc")
      .get()
      .then((res) => {
        for (let i = 0; i < res.data.length; i++) {
          arr.push(res.data[i].blogId)
          console.log(arr)
        }
      })

    ctx.body = await blogCollection
      .where({
        _id: _.in(arr)
      })
      .skip(event.start)
      .limit(event.count)
      .get()
      .then(res => {
        console.log('blog', res.data)
        return res.data
      })

  })
  /**
   * 获取用户自己的博客
   */
  app.router('getUserBlog', async(ctx, next) => {
    const {
      OPENID
    } = cloud.getWXContext()
    ctx.body = await blogCollection
      .where({
        _openid: OPENID
      })
      .skip(event.start)
      .limit(event.count)
      .get()
      .then(res => {
        return res.data
      })
  })
  /**
   * 刷新用户读书时间
   */
  app.router('updateAllTime', async(ctx, next) => {
    console.log('data', event)
    const {
      OPENID
    } = cloud.getWXContext()
    await db.collection('user')
      .where({
        _openid: OPENID
      })
      .update({
        data: {
          readTime: _.inc(parseInt(event.readTime))
        }
      })

    await blogCollection.add({
      data: {
        school: event.school,
        _openid: OPENID,
        avatarUrl: event.avatarUrl,
        nickName: event.nickName,
        content: event.content,
        img: event.img,
        createTime: db.serverDate(), // 服务端的时间
        readBook: event.readBook,
        readTime: event.readTime,
        envirment: event.envirment,
        likes: 0,
        type: 0,
      }
    })
  })
  return app.serve()
}