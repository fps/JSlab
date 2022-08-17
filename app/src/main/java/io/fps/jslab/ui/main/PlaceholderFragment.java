package io.fps.jslab.ui.main;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.Observer;
import androidx.lifecycle.ViewModelProvider;

import io.fps.jslab.R;
import io.fps.jslab.databinding.FragmentMainBinding;

/**
 * A placeholder fragment containing a simple view.
 */
public class PlaceholderFragment extends Fragment {

    private static final String ARG_SECTION_NUMBER = "section_number";

    private PageViewModel pageViewModel;
    private FragmentMainBinding binding;

    private WebView webView;
    private Bundle webViewBundle = null;

    public static PlaceholderFragment newInstance(int index) {
        PlaceholderFragment fragment = new PlaceholderFragment();
        Bundle bundle = new Bundle();
        bundle.putInt(ARG_SECTION_NUMBER, index);
        fragment.setArguments(bundle);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        pageViewModel = new ViewModelProvider(this).get(PageViewModel.class);
        int index = 1;
        if (getArguments() != null) {
            index = getArguments().getInt(ARG_SECTION_NUMBER);
        }
        pageViewModel.setIndex(index);
    }

    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {

        binding = FragmentMainBinding.inflate(inflater, container, false);
        View root = binding.getRoot();

        int index = pageViewModel.getIndex();
        // Log.d("io.fps.jslab", String.format("%d", index));
        webView = binding.sectionLabel;

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setDomStorageEnabled(true);

        Log.d("io.fps.jslab", "ok");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                Log.d("io.fps.jslab", "finished");
                view.evaluateJavascript(String.format("jslab_init('tab%d');", index), null);
                view.evaluateJavascript("javascript:alert(1);", null);
            }

            @Override
            public void onReceivedError(WebView view,
                                        int errorCode,
                                        String description,
                                        String failingUrl) {
                Log.e("io.fps.jslab", description);
            }
        });

        if (webViewBundle != null) {
            webView.restoreState(webViewBundle);
        } else {
            webView.loadUrl("file:///android_asset/index.html");
        }
        /*
        pageViewModel.getText().observe(getViewLifecycleOwner(), new Observer<String>() {
            @Override
            public void onChanged(@Nullable String s) {
                webView.setText(s);
            }
        });*/
        return root;
    }

    @Override
    public void onPause() {
        webViewBundle = new Bundle();
        webView.saveState(webViewBundle);
        super.onPause();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}