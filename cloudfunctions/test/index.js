// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()
const userCollection = db.collection('user')
// 云函数入口函数
exports.main = async(event, context) => {
  await userCollection
    .orderBy('updateTime', 'desc')
    .get()
    .then(async res => {
      // for (let i = 0; i < 59; i++) {
      //   let curId = res.data[i]._openid
      //   for (let j = i + 1; j < 59; j++) {
      //     let eachId = res.data[j]._openid
      //     if (curId === eachId) {
      //       console.log('id',curId)
      //     }
      //   }
      // }
      for(let k =0;k<59;k++){
        let curId=res.data[k]._openid
        await userCollection.where({_openid:curId}).get()
        .then(async res=>{
if(res.data.length==1){
  console.log(res.data)
}
        })
      }
    })

}