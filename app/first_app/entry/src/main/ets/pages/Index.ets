@Entry
@Component
struct Index {
  @State private isLoggedIn: boolean = false
  @State private isLoginMode: boolean = true
  @State private username: string = ''
  @State private password: string = ''
  @State private confirmPassword: string = ''
  @State private isRememberPassword: boolean = false
  @State private isAgreeTerms: boolean = false
  @State private message: string = 'Hello World'

  private showToast(message: string): void {
    AlertDialog.show({
      message: message,
      autoCancel: true,
      alignment: DialogAlignment.Center,
      offset: { dx: 0, dy: 0 },
      gridCount: 4,
      buttons: [
        {
          value: '确定',
          action: () => {}
        }
      ]
    })
  }

  private handleLogin(): void {
    if (!this.isAgreeTerms) {
      this.showToast('请先同意用户协议和隐私政策')
      return
    }
    if (this.username.length === 0 && this.password.length === 0) {
      this.showToast('请输入用户名和密码')
      return
    }
    if (this.username.length === 0) {
      this.showToast('请输入用户名')
      return
    }
    if (this.password.length === 0) {
      this.showToast('请输入密码')
      return
    }
    this.showToast('登录成功!')
    setTimeout(() => {
      this.isLoggedIn = true
    }, 500)
  }

  private handleRegister(): void {
    if (!this.isAgreeTerms) {
      this.showToast('请先同意用户协议和隐私政策')
      return
    }
    if (this.username.length === 0 && this.password.length === 0 && this.confirmPassword.length === 0) {
      this.showToast('请填写完整注册信息')
      return
    }
    if (this.username.length === 0) {
      this.showToast('请输入用户名')
      return
    }
    if (this.password.length === 0) {
      this.showToast('请输入密码')
      return
    }
    if (this.confirmPassword.length === 0) {
      this.showToast('请确认密码')
      return
    }
    if (this.password !== this.confirmPassword) {
      this.showToast('两次输入的密码不一致')
      return
    }
    this.showToast('注册成功!')
    setTimeout(() => {
      this.isLoggedIn = true
    }, 500)
  }

  private handleThirdPartyLogin(platform: string): void {
    if (!this.isAgreeTerms) {
      this.showToast('请先同意用户协议和隐私政策')
      return
    }
    if (platform === 'wechat') {
      this.showToast('微信登录成功!')
    } else if (platform === 'qq') {
      this.showToast('QQ登录成功!')
    }
    setTimeout(() => {
      this.isLoggedIn = true
    }, 500)
  }

  @Builder
  private buildLogoArea() {
    Column() {
      Image($r('app.media.startIcon'))
        .width(80)
        .height(80)
        .borderRadius(16)
        .margin({ bottom: 12 })

      Text('MyApplication')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .fontColor('#333333')
    }
    .margin({ top: 40, bottom: 30 })
  }

  @Builder
  private buildInputRow(label: string, placeholder: string, isPassword: boolean, inputValue: string, onChange: (value: string) => void) {
    Row() {
      Text(label)
        .fontSize(16)
        .fontColor('#333333')
        .width(70)
        .textAlign(TextAlign.Start)

      if (isPassword) {
        TextInput({ placeholder: placeholder, text: inputValue })
          .type(InputType.Password)
          .layoutWeight(1)
          .height(44)
          .backgroundColor('#F5F5F5')
          .borderRadius(8)
          .padding({ left: 12, right: 12 })
          .onChange((value: string) => {
            onChange(value)
          })
      } else {
        TextInput({ placeholder: placeholder, text: inputValue })
          .layoutWeight(1)
          .height(44)
          .backgroundColor('#F5F5F5')
          .borderRadius(8)
          .padding({ left: 12, right: 12 })
          .onChange((value: string) => {
            onChange(value)
          })
      }
    }
    .width('100%')
    .alignItems(VerticalAlign.Center)
    .margin({ bottom: 16 })
  }

  @Builder
  private buildLoginForm() {
    Column() {
      this.buildInputRow('用户名:', '请输入用户名', false, this.username, (value: string) => {
        this.username = value
      })

      this.buildInputRow('密码:', '请输入密码', true, this.password, (value: string) => {
        this.password = value
      })

      Row() {
        Row() {
          Checkbox()
            .select(this.isRememberPassword)
            .selectedColor('#007DFF')
            .onChange((isChecked: boolean) => {
              this.isRememberPassword = isChecked
            })
          Text('记住密码')
            .fontSize(14)
            .fontColor('#666666')
            .margin({ left: 4 })
        }

        Blank()

        Text('忘记密码?')
          .fontSize(14)
          .fontColor('#007DFF')
          .onClick(() => {
          })
      }
      .width('100%')
      .margin({ bottom: 24 })
    }
  }

  @Builder
  private buildRegisterForm() {
    Column() {
      this.buildInputRow('用户名:', '请输入用户名', false, this.username, (value: string) => {
        this.username = value
      })

      this.buildInputRow('密码:', '请输入密码', true, this.password, (value: string) => {
        this.password = value
      })

      this.buildInputRow('确认密码:', '请再次输入密码', true, this.confirmPassword, (value: string) => {
        this.confirmPassword = value
      })
    }
  }

  @Builder
  private buildSubmitButton() {
    Button(this.isLoginMode ? '登 录' : '注 册')
      .width('100%')
      .height(48)
      .fontSize(18)
      .fontColor(Color.White)
      .backgroundColor('#007DFF')
      .borderRadius(24)
      .margin({ bottom: 16 })
      .enabled(this.isAgreeTerms)
      .opacity(this.isAgreeTerms ? 1 : 0.5)
      .onClick(() => {
        if (this.isLoginMode) {
          this.handleLogin()
        } else {
          this.handleRegister()
        }
      })
  }

  @Builder
  private buildModeSwitch() {
    Row() {
      Text(this.isLoginMode ? '没有账号?' : '已有账号?')
        .fontSize(14)
        .fontColor('#666666')

      Text(this.isLoginMode ? '立即注册' : '立即登录')
        .fontSize(14)
        .fontColor('#007DFF')
        .margin({ left: 4 })
        .onClick(() => {
          this.isLoginMode = !this.isLoginMode
          this.confirmPassword = ''
        })
    }
    .width('100%')
    .justifyContent(FlexAlign.Center)
    .margin({ bottom: 24 })
  }

  @Builder
  private buildDivider() {
    Row() {
      Divider()
        .layoutWeight(1)
        .color('#E0E0E0')

      Text('其他登录方式')
        .fontSize(12)
        .fontColor('#999999')
        .margin({ left: 16, right: 16 })

      Divider()
        .layoutWeight(1)
        .color('#E0E0E0')
    }
    .width('100%')
    .margin({ bottom: 24 })
  }

  @Builder
  private buildThirdPartyLogin() {
    Row() {
      Button() {
        Column() {
          Text('微')
            .fontSize(24)
            .fontColor(Color.White)
            .fontWeight(FontWeight.Bold)
        }
      }
      .width(56)
      .height(56)
      .backgroundColor('#07C160')
      .borderRadius(28)
      .onClick(() => {
        this.handleThirdPartyLogin('wechat')
      })

      Blank()
        .width(60)

      Button() {
        Column() {
          Text('Q')
            .fontSize(24)
            .fontColor(Color.White)
            .fontWeight(FontWeight.Bold)
        }
      }
      .width(56)
      .height(56)
      .backgroundColor('#12B7F5')
      .borderRadius(28)
      .onClick(() => {
        this.handleThirdPartyLogin('qq')
      })
    }
    .width('100%')
    .justifyContent(FlexAlign.Center)
    .margin({ bottom: 24 })
  }

  @Builder
  private buildTermsRow() {
    Row() {
      Checkbox()
        .select(this.isAgreeTerms)
        .selectedColor('#007DFF')
        .onChange((isChecked: boolean) => {
          this.isAgreeTerms = isChecked
        })

      Text('我已阅读并同意')
        .fontSize(12)
        .fontColor('#666666')

      Text('《用户协议》')
        .fontSize(12)
        .fontColor('#007DFF')

      Text('和')
        .fontSize(12)
        .fontColor('#666666')

      Text('《隐私政策》')
        .fontSize(12)
        .fontColor('#007DFF')
    }
    .width('100%')
    .justifyContent(FlexAlign.Center)
    .margin({ bottom: 16 })
  }

  @Builder
  private buildLoginPage() {
    Column() {
      this.buildLogoArea()

      this.buildInputRow('用户名:', '请输入用户名', false, this.username, (value: string) => {
        this.username = value
      })

      this.buildInputRow('密码:', '请输入密码', true, this.password, (value: string) => {
        this.password = value
      })

      Row() {
        Row() {
          Checkbox()
            .select(this.isRememberPassword)
            .selectedColor('#007DFF')
            .onChange((isChecked: boolean) => {
              this.isRememberPassword = isChecked
            })
          Text('记住密码')
            .fontSize(14)
            .fontColor('#666666')
            .margin({ left: 4 })
        }

        Blank()

        Text('忘记密码?')
          .fontSize(14)
          .fontColor('#007DFF')
      }
      .width('100%')
      .margin({ bottom: 24 })

      this.buildTermsRow()

      Button('登 录')
        .width('100%')
        .height(48)
        .fontSize(18)
        .fontColor(Color.White)
        .backgroundColor('#007DFF')
        .borderRadius(24)
        .margin({ bottom: 16 })
        .enabled(this.isAgreeTerms)
        .opacity(this.isAgreeTerms ? 1 : 0.5)
        .onClick(() => {
          this.handleLogin()
        })

      Row() {
        Text('没有账号?')
          .fontSize(14)
          .fontColor('#666666')

        Text('立即注册')
          .fontSize(14)
          .fontColor('#007DFF')
          .margin({ left: 4 })
          .onClick(() => {
            this.isLoginMode = false
          })
      }
      .width('100%')
      .justifyContent(FlexAlign.Center)
      .margin({ bottom: 24 })

      this.buildDivider()

      Row() {
        Button() {
          Column() {
            Text('微')
              .fontSize(24)
              .fontColor(Color.White)
              .fontWeight(FontWeight.Bold)
          }
        }
        .width(56)
        .height(56)
        .backgroundColor('#07C160')
        .borderRadius(28)
        .enabled(this.isAgreeTerms)
        .opacity(this.isAgreeTerms ? 1 : 0.5)
        .onClick(() => {
          this.handleThirdPartyLogin('wechat')
        })

        Blank()
          .width(60)

        Button() {
          Column() {
            Text('Q')
              .fontSize(24)
              .fontColor(Color.White)
              .fontWeight(FontWeight.Bold)
          }
        }
        .width(56)
        .height(56)
        .backgroundColor('#12B7F5')
        .borderRadius(28)
        .enabled(this.isAgreeTerms)
        .opacity(this.isAgreeTerms ? 1 : 0.5)
        .onClick(() => {
          this.handleThirdPartyLogin('qq')
        })
      }
      .width('100%')
      .justifyContent(FlexAlign.Center)
    }
    .width('100%')
    .height('100%')
    .padding({ left: 24, right: 24 })
    .backgroundColor(Color.White)
  }

  @Builder
  private buildRegisterPage() {
    Column() {
      this.buildLogoArea()

      this.buildInputRow('用户名:', '请输入用户名', false, this.username, (value: string) => {
        this.username = value
      })

      this.buildInputRow('密码:', '请输入密码', true, this.password, (value: string) => {
        this.password = value
      })

      this.buildInputRow('确认密码:', '请再次输入密码', true, this.confirmPassword, (value: string) => {
        this.confirmPassword = value
      })

      this.buildTermsRow()

      Button('注 册')
        .width('100%')
        .height(48)
        .fontSize(18)
        .fontColor(Color.White)
        .backgroundColor('#007DFF')
        .borderRadius(24)
        .margin({ bottom: 16 })
        .enabled(this.isAgreeTerms)
        .opacity(this.isAgreeTerms ? 1 : 0.5)
        .onClick(() => {
          this.handleRegister()
        })

      Row() {
        Text('已有账号?')
          .fontSize(14)
          .fontColor('#666666')

        Text('立即登录')
          .fontSize(14)
          .fontColor('#007DFF')
          .margin({ left: 4 })
          .onClick(() => {
            this.isLoginMode = true
            this.confirmPassword = ''
          })
      }
      .width('100%')
      .justifyContent(FlexAlign.Center)
      .margin({ bottom: 24 })

      this.buildDivider()

      Row() {
        Button() {
          Column() {
            Text('微')
              .fontSize(24)
              .fontColor(Color.White)
              .fontWeight(FontWeight.Bold)
          }
        }
        .width(56)
        .height(56)
        .backgroundColor('#07C160')
        .borderRadius(28)
        .enabled(this.isAgreeTerms)
        .opacity(this.isAgreeTerms ? 1 : 0.5)
        .onClick(() => {
          this.handleThirdPartyLogin('wechat')
        })

        Blank()
          .width(60)

        Button() {
          Column() {
            Text('Q')
              .fontSize(24)
              .fontColor(Color.White)
              .fontWeight(FontWeight.Bold)
          }
        }
        .width(56)
        .height(56)
        .backgroundColor('#12B7F5')
        .borderRadius(28)
        .enabled(this.isAgreeTerms)
        .opacity(this.isAgreeTerms ? 1 : 0.5)
        .onClick(() => {
          this.handleThirdPartyLogin('qq')
        })
      }
      .width('100%')
      .justifyContent(FlexAlign.Center)
    }
    .width('100%')
    .height('100%')
    .padding({ left: 24, right: 24 })
    .backgroundColor(Color.White)
  }

  @Builder
  private buildSuccessPage() {
    Column() {
      Text(this.message)
        .fontSize(50)
        .fontWeight(FontWeight.Bold)
        .fontColor('#333333')

      Text('登录成功!')
        .fontSize(18)
        .fontColor('#666666')
        .margin({ top: 16 })

      Button('退出登录')
        .width(200)
        .height(44)
        .fontSize(16)
        .fontColor(Color.White)
        .backgroundColor('#007DFF')
        .borderRadius(22)
        .margin({ top: 40 })
        .onClick(() => {
          this.isLoggedIn = false
          this.username = ''
          this.password = ''
          this.confirmPassword = ''
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .backgroundColor(Color.White)
  }

  build() {
    Column() {
      if (this.isLoggedIn) {
        this.buildSuccessPage()
      } else {
        if (this.isLoginMode) {
          this.buildLoginPage()
        } else {
          this.buildRegisterPage()
        }
      }
    }
    .width('100%')
    .height('100%')
  }
}
