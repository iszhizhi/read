// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'production-ny6ui',
  traceUser: true,
})
const TcbRouter = require('tcb-router')
const db = cloud.database()
const userCollection = db.collection('user')
const _ = db.command
// 云函数入口函数
exports.main = async(event, context) => {
  const app = new TcbRouter({
    event
  })
  /**
   * 获取用户学校
   */
  app.router('school', async(ctx, next) => {
    const {
      OPENID
    } = cloud.getWXContext()
    ctx.body = await userCollection
      .where({
        _openid: OPENID
      })
      .get()
      .then(res => {
        return res.data
      })
  })
  /**
   * 判断用户是否存在，不存在就添加信息到数据库
   */
  app.router('adduser', async(ctx, next) => {
    const {
      OPENID
    } = cloud.getWXContext()
    await userCollection.add({
      data: {
        _openid: OPENID,
        updateTime: db.serverDate(),
        school: '未填写',
        readTime: 0, //读书时间初始化
        limitDays: 0,
      }
    })
  })
  /**
   * 记录用户连续打卡天数
   */
  app.router('limitDays', async(ctx, next) => {
    //type==0表示加一 ==-1表示断更
    const {
      OPENID
    } = cloud.getWXContext()
    if (event.type == 0) {
      await userCollection.where({
          _openid: OPENID
        })
        .update({
          data: {
            limitDays: _.inc(1)
          }
        })
    } else if (event.type == 1) {
      await userCollection.where({
          _openid: OPENID
        })
        .update({
          data: {
            limitDays: 0
          }
        })
    }
  })
  return app.serve()

}