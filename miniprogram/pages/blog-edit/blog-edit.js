  // 输入文字最大的个数
  const MAX_WORDS_NUM = 140
  // 最大上传图片数量
  const MAX_IMG_NUM = 9
  //用户打卡的选择
  const db = wx.cloud.database()
  // 输入的文字内容
  let openid = wx.getStorageSync('openid')
  let content = ''
  let userInfo = {}
  let readBook = ''
  let readTime = ''
  let envirment = ''
  let tmp = ''
  let school = ''
  let isWriteSchool = false
  let type = 0
  let oneDayMS = 86400000
  Page({

    /**
     * 页面的初始数据
     */
    data: {
      array: ["随手捡垃圾", "不乱扔垃圾", "没有使用一次性物品", "绿色出行", "随手关灯", "无浪费粮食"], //环保打卡选项
      // 输入的文字个数
      wordsNum: 0,
      footerBottom: 0,
      images: [],
      selectPhoto: true, // 添加图片元素是否显示
      timeWidth: 60,
      bookWidth: 40, //输入框起始宽度，随着输入的字数变多自动变长
      isProtect: false, //用于控制是读书界面还是打卡界面
      userChooseProtect: [],
      userProtect: '',
      readAllTime: 0, //读书总时间
      writeSchool: false, //
    },
    /**
     * 用户填写的学校
     */
    inputSchool(e) {
      school = e.detail.value
      console.log('school', school)
    },
    /**
     * 更新用户学校
     */
    updateSchool(e) {
      if (school == '') {
        wx.showModal({
          title: '请输入您的学校哦',
          content: '',
          showCancel: false,
          confirmColor: "#86c166"
        })
      } else {
        db.collection('user').where({
          _openid: openid
        }).update({
          data: {
            updateTime: db.serverDate(),
            school: school
          }
        }).then(res => {
          isWriteSchool = true //说明用户已经填写了学校信息
          this.setData({
            writeSchool: false
          })
          wx.showToast({
            title: '修改成功',
          })
        }).catch(err => {
          wx.showModal({
            title: '请检查您的网络再试',
            content: '',
            showCancel: false,
            confirmColor: "#86c166"
          })
        })
      }
    },
    /**
     * 判断用户是否填写了学校，没填写的话弹出框，让用户填写
     */
    writeSchool() {
      if (!wx.getStorageSync('school')) {
        wx.cloud.callFunction({
          name: 'user',
          data: {
            $url: 'school'
          }
        }).then(res => {
          if (res.result[0].school == '未填写') {
            this.setData({
              writeSchool: true
            })
          } else {

            school = res.result[0].school
            console.log('school', school)
            isWriteSchool = true
            wx.setStorageSync('school', school)

          }
        })
      }else{
        isWriteSchool=true
      }
    },
    /**
     * 获取用户累计读书时长
     */
    getAllTime(e) {
      wx.cloud.database()
        .collection('user')
        .where({
          _openid: wx.getStorageSync('openid')
        })
        .get()
        .then(res => {
          console.log("readAll")
          this.setData({
            readAllTime: res.data[0].readTime
          })
        })
    },
    // bindPickerChange(e) {
    //   this.setData({
    //     index: e.detail.value
    //   })
    //   envirment = this.data.array[e.detail.value]
    // },


    /**
     * 环保打卡
     */
    protectEnvirement(e) {
      this.setData({
        isProtect: true
      })
    },

    inputProtect(e) {
      let userProtect = e.detail.value;
      this.setData({
        userProtect
      })
    },

    finishedProtect(e) {
      tmp = ''
      let userProtect = this.data.userProtect
      let userChooseProtect = this.data.userChooseProtect
      if (userChooseProtect.length == 0 && userProtect == 0) {
        wx.showModal({
          title: '请打卡哦',
          content: '',
          showCancel: false,
          confirmColor: "#86c166"
        })
      } else {
        for (let i = 0; i < userChooseProtect.length; i++) {
          console.log(tmp)
          tmp += userChooseProtect[i]
        }
        envirment = tmp + userProtect
      }
      console.log(envirment)
      this.setData({
        isProtect: false
      })
    },

    /**
     * 获取用户当前选择的打卡
     */
    getUserChooseProtect(e) {
      let item = e.currentTarget.dataset.choose
      //判断用户是否选择了相同的
      if (this.data.userChooseProtect.indexOf(item) == -1) {
        this.data.userChooseProtect.push(item)
      } else {
        for (let i = 0; i < this.data.userChooseProtect.length; i++) {
          if (this.data.userChooseProtect[i] == item) {
            this.data.userChooseProtect.splice(i, 1)
          }
        }
      }
      this.setData({
        userChooseProtect: this.data.userChooseProtect
      })

    },

    /**
     * 获取读的书籍和读书时长以及自适应宽度，目前书籍最多8个字
     */
    getReadBook(e) {

      let currentWordsLength = e.detail.value.length
      readBook = e.detail.value
      this.setData({
        bookWidth: currentWordsLength == 0 ? 40 : currentWordsLength * 40,
        readBook,
      }, () => {
        wx.setStorageSync('readBook', readBook)
        wx.setStorageSync('bookWidth', this.data.bookWidth)
      })
    },
    getReadTime(e) {
      console.log(e)
      console.log(e)
      console.log("dta", parseInt(e.detail.value))
      if (parseInt(e.detail.value) > 120) {
        wx.showModal({
          title: '读书时间最多120分钟，明天继续加油呀',
          content: '',
          showCancel: false,
          confirmColor: "#86c166"
        })
        wx.setStorageSync('readTime', '')
        this.setData({
          readTime: ''
        })
        return
      }
      let currentWordsLength = e.detail.value.length
      readTime = e.detail.value
      this.setData({
        timeWidth: currentWordsLength == 0 ? 25 : currentWordsLength * 22,
        readTime
      }, () => {
        wx.setStorageSync('readTime', readTime)
      })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
      userInfo = options
      console.log(options)
      this.getAllTime() //获取用户读书总时间
      this.initData() //初始化数据
      this.writeSchool() //判断用户学校是否存在

    },
    /**
     * 一些数据的初始化
     */
    initData() {
      this.setData({
        readTime: wx.getStorageSync('readTime'),
        readBook: wx.getStorageSync('readBook'),
      }, () => {
        readTime = this.data.readTime,
          readBook = this.data.readBook
      })
      if (wx.getStorageSync('bookWidth') != '') {
        this.setData({
          bookWidth: wx.getStorageSync('bookWidth')
        })
      } else {
        this.setData({
          bookWidth: 40
        })
      }
    },
    onInput(event) {
      // console.log(event.detail.value)
      let wordsNum = event.detail.value.length

      this.setData({
        wordsNum
      })
      content = event.detail.value
    },

    // onFocus(event) {
    //   // 模拟器获取的键盘高度为0
    //   // console.log(event)
    //   this.setData({
    //     footerBottom: event.detail.height,
    //   })
    // },
    // onBlur() {
    //   this.setData({
    //     footerBottom: 0,
    //   })
    // },

    onChooseImage() {
      // 还能再选几张图片
      let max = MAX_IMG_NUM - this.data.images.length
      wx.chooseImage({
        count: max,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          console.log(res)
          this.setData({
            images: this.data.images.concat(res.tempFilePaths)
          })
          // 还能再选几张图片
          max = MAX_IMG_NUM - this.data.images.length
          this.setData({
            selectPhoto: max <= 0 ? false : true
          })
        },
      })
    },
    onDelImage(event) {
      this.data.images.splice(event.target.dataset.index, 1)
      this.setData({
        images: this.data.images
      })
      if (this.data.images.length == MAX_IMG_NUM - 1) {
        this.setData({
          selectPhoto: true,
        })
      }
    },

    onPreviewImage(event) {
      // 6/9
      wx.previewImage({
        urls: this.data.images,
        current: event.target.dataset.imgsrc,
      })
    },
    /**
     * 发布用户打卡信息
     */
    send() {
      if (isWriteSchool) {
        if (content.trim() === '') {
          wx.showModal({
            title: '您还没有写读书感悟哦',
            content: '',
            showCancel: false,
            confirmColor: "#86c166"
          })
          return
        } else if (readBook.trim() === '') {
          wx.showModal({
            title: '您还没输入读的书籍哦',
            content: '',
            showCancel: false,
            confirmColor: "#86c166"
          })
          return
        } else if (readTime.trim() === '') {
          wx.showModal({
            title: '您还没输入读书时间哦',
            content: '',
          })
          return
        } else if (envirment.trim() === '') {
          wx.showModal({
            title: '您还没环保打卡哦',
            content: '',
            showCancel: false,
            confirmColor: "#86c166"
          })
          return
        }
        wx.showLoading({
          title: '发布中',
          mask: true,
        })
        wx.cloud.callFunction({
          name: 'check',
          data: {
            text: content + readBook + envirment
          }
        }).then(res => {
          if (res.result == null) {
            wx.hideLoading()
            wx.showModal({
              title: '提示',
              content: '您的内容可能含有敏感词汇，请检查',
              showCancel: false,
              confirmColor: "#86c166"
            })
          } else if (res.result.errCode === 0) {
          
            let promiseArr = []
            let fileIds = []
            // 图片上传
            for (let i = 0, len = this.data.images.length; i < len; i++) {
              let p = new Promise((resolve, reject) => {
                let item = this.data.images[i]
                // 文件扩展名
                let suffix = /\.\w+$/.exec(item)[0] //正则表达式
                wx.cloud.uploadFile({
                  cloudPath: 'blog/' + Date.now() + '-' + Math.random() * 1000000 + suffix, //文件名，防止重复
                  filePath: item,
                  success: (res) => {
                    console.log(res.fileID)
                    fileIds = fileIds.concat(res.fileID)
                    resolve()
                  },
                  fail: (err) => {
                    console.error(err)
                    reject()
                  }
                })
              })
              promiseArr.push(p)
            }
            // 存入到云数据库
            Promise.all(promiseArr).then((res) => {
              wx.cloud.callFunction({
                name: 'blog',
                data: {
                  $url: 'updateAllTime',
                  avatarUrl: userInfo.avatarUrl,
                  nickName: userInfo.nickName,
                  content,
                  img: fileIds,
                  createTime: db.serverDate(), // 服务端的时间
                  readBook,
                  readTime,
                  envirment: envirment,
                }
              })
                .then((res) => {
                  wx.setStorageSync('cardTime', new Date().getTime())
                  this.updateLimitDays()
                  wx.hideLoading()
                  wx.showToast({
                    title: '发布成功',
                  })
                  // 返回blog页面，并且刷新
                  wx.navigateBack()
                  const pages = getCurrentPages()
                  // console.log(pages)
                  // 取到上一个页面
                  const prevPage = pages[pages.length - 2]
                  prevPage.onPullDownRefresh()
                })
            }).catch((err) => {
              wx.hideLoading()
              wx.showToast({
                title: '发布失败',
              })
            })
          } else {
            this.setData({
              writeSchool: true
            })


          }
        })
       

    


      }
    },
    /**
     * 更新连续读书打卡
     */
    updateLimitDays() {
      wx.cloud.callFunction({
        name: 'user',
        data: {
          type,
          $url: 'limitDays'
        }
      }).then(res => {
        console.log('success', res)
      })
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
  })