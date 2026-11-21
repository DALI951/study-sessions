package com.dali951.studysessions;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMinimumFontSize(12);
        web.setWebViewClient(new WebViewClient());
        web.setBackgroundColor(0xFFF6F2EA);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(false);
        }
        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);
    }

    private void exitIfAllowed() {
        super.onBackPressed();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.appBack && window.appBack()) === true",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    if (!"true".equals(value)) {
                        exitIfAllowed();
                    }
                }
            });
    }
}
