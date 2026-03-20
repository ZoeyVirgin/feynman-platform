import web_webview from '@ohos.web.webview';

@Entry
@Component
struct Index {
  private controller: web_webview.WebviewController = new web_webview.WebviewController();
  @State loading: boolean = false;
  @State progress: number = 0;
  @State message: string = '';
  @State currentUrl: string = 'index.html';
  @State inputUrl: string = '';
  @State canGoBackState: boolean = false;
  @State canGoForwardState: boolean = false;

  aboutToAppear(): void {
    // 本地HTML文件不需要预连接
  }

  build() {
    Column() {
      Row() {
        Button('后退')
          .fontSize(14)
          .height(36)
          .backgroundColor(this.canGoBackState ? '#007DFF' : '#CCCCCC')
          .enabled(this.canGoBackState)
          .onClick(() => {
            this.controller.backward();
          })

        Button('前进')
          .fontSize(14)
          .height(36)
          .backgroundColor(this.canGoForwardState ? '#007DFF' : '#CCCCCC')
          .margin({ left: 8 })
          .enabled(this.canGoForwardState)
          .onClick(() => {
            this.controller.forward();
          })

        Button('刷新')
          .fontSize(14)
          .height(36)
          .backgroundColor('#52C41A')
          .margin({ left: 8 })
          .onClick(() => {
            this.controller.refresh();
          })

        Button('首页')
          .fontSize(14)
          .height(36)
          .backgroundColor('#FA8C16')
          .margin({ left: 8 })
          .onClick(() => {
            this.controller.loadUrl('https://www.baidu.com');
          })

        Button('调用JS')
          .fontSize(14)
          .height(36)
          .backgroundColor('#722ED1')
          .margin({ left: 8 })
          .onClick(() => {
            try {
              this.controller.runJavaScript(
                'receiveFromNative("来自鸿蒙原生的消息: ' + new Date().toLocaleTimeString() + '")',
                (err: Error, result: string) => {
                  if (err) {
                    console.log('runJavaScript error:', err.message);
                  } else {
                    console.log('runJavaScript result:', result);
                  }
                }
              );
            } catch (e) {
              const errorMsg: string = String(e);
              console.log('runJavaScript exception:', errorMsg);
            }
          })
      }
      .width('100%')
      .padding({ left: 12, right: 12, top: 8, bottom: 8 })
      .justifyContent(FlexAlign.Start)
      .backgroundColor('#F5F5F5')

      Row() {
        TextInput({ placeholder: '输入网址...', text: this.inputUrl })
          .layoutWeight(1)
          .height(36)
          .backgroundColor(Color.White)
          .borderRadius(4)
          .onChange((value: string) => {
            this.inputUrl = value;
          })

        Button('前往')
          .fontSize(14)
          .height(36)
          .width(60)
          .backgroundColor('#007DFF')
          .margin({ left: 8 })
          .onClick(() => {
            let url: string = this.inputUrl.trim();
            if (url.length > 0) {
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
              }
              this.controller.loadUrl(url);
            }
          })
      }
      .width('100%')
      .padding({ left: 12, right: 12, top: 4, bottom: 8 })
      .backgroundColor('#F5F5F5')

      if (this.loading) {
        Progress({ value: this.progress, total: 100 })
          .width('100%')
          .height(3)
          .color('#007DFF')
      }

      if (this.message.length > 0) {
        Row() {
          Text('收到消息: ')
            .fontSize(12)
            .fontColor('#666666')
          Text(this.message)
            .fontSize(12)
            .fontColor('#007DFF')
            .layoutWeight(1)
        }
        .width('100%')
        .padding({ left: 12, right: 12, top: 4, bottom: 4 })
        .backgroundColor('#FFF7E6')
      }

      Web({
        src: $rawfile('index.html'),
        controller: this.controller
      })
        .width('100%')
        .layoutWeight(1)
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .fileAccess(true)
        .imageAccess(true)
        .mixedMode(MixedMode.All)
        .onPageBegin((event) => {
          this.loading = true;
          this.progress = 0;
          if (event) {
            this.currentUrl = event.url;
            this.inputUrl = event.url;
          }
        })
        .onProgressChange((event) => {
          if (event) {
            this.progress = event.newProgress;
          }
        })
        .onPageEnd(() => {
          this.loading = false;
          this.canGoBackState = this.controller.accessBackward();
          this.canGoForwardState = this.controller.accessForward();
          try {
            this.controller.registerJavaScriptProxy({
              callNative: (msg: string): void => {
                this.message = msg;
              }
            }, 'HarmonyBridge', ['callNative']);
          } catch (err) {
            const errorMsg: string = String(err);
            console.log('registerJavaScriptProxy error:', errorMsg);
          }
        })
        .onErrorReceive((event) => {
          this.loading = false;
          if (event) {
            console.log('WebView加载错误:', event.error.getErrorInfo());
          }
        })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(Color.White)
  }
}
