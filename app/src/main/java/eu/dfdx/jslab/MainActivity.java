package eu.dfdx.jslab;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;

import android.util.Log;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebView;

import java.util.List;
import java.util.UUID;

import eu.dfdx.jslab.ui.main.SectionsPagerAdapter;
import eu.dfdx.jslab.databinding.ActivityMainBinding;
import eu.dfdx.jslab.R;

public class MainActivity extends AppCompatActivity {

    private ActivityMainBinding binding;
    protected SectionsPagerAdapter sectionsPagerAdapter;

    protected boolean fabsVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        sectionsPagerAdapter = new SectionsPagerAdapter(this);

        SharedPreferences pref = getSharedPreferences(getString(R.string.preferences_key), Context.MODE_PRIVATE);
        SharedPreferences.Editor edit = pref.edit();

        Gson gson = new Gson();
        List<String> uuids = gson.fromJson(pref.getString("uuids", "[]"), new TypeToken<List<String>>() {}.getType());

        if (uuids.isEmpty()) {
            sectionsPagerAdapter.addItem(UUID.randomUUID().toString());
        } else {
            for (int index = 0; index < uuids.size(); ++index) {
                sectionsPagerAdapter.addItem(uuids.get(index));
            }
        }

        ViewPager2 viewPager = binding.viewPager;
        viewPager.setUserInputEnabled(false);
        viewPager.setOffscreenPageLimit(50);
        viewPager.setAdapter(sectionsPagerAdapter);

        TabLayout tabs = binding.tabs;

        TabLayoutMediator mediator = new TabLayoutMediator(tabs, viewPager, new TabLayoutMediator.TabConfigurationStrategy() {
            @Override
            public void onConfigureTab(@NonNull TabLayout.Tab tab, int position) {
                tab.setText(sectionsPagerAdapter.getUUIDs().get(position).substring(0, 6));
            }
        });
        mediator.attach();
        // tabs.setupWithViewPager(viewPager);

        FloatingActionButton fab = binding.fab;
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (fabsVisible) {
                    binding.fabAdd.setVisibility(View.GONE);
                    binding.fabRemove.setVisibility(View.GONE);
                    binding.fabShare.setVisibility(View.GONE);
                    fabsVisible = false;
                } else {
                    // sectionsPagerAdapter.setCount(sectionsPagerAdapter.getCount()+1);
                    binding.fabAdd.setVisibility(View.VISIBLE);
                    binding.fabRemove.setVisibility(View.VISIBLE);
                    binding.fabShare.setVisibility(View.VISIBLE);
                    fabsVisible = true;
                }
            }
        });

        FloatingActionButton fabAdd = binding.fabAdd;
        fabAdd.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                sectionsPagerAdapter.addItem(UUID.randomUUID().toString());
                sectionsPagerAdapter.notifyDataSetChanged();
                fab.callOnClick();
            }
        });

        FloatingActionButton fabRemove = binding.fabRemove;
        fabRemove.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                sectionsPagerAdapter.removeItem(viewPager.getCurrentItem());
                if (sectionsPagerAdapter.getItemCount() == 0) {
                    sectionsPagerAdapter.addItem(UUID.randomUUID().toString());
                }
                sectionsPagerAdapter.notifyDataSetChanged();
                fab.callOnClick();
            }
        });

        FloatingActionButton fabShare = binding.fabShare;
        fabShare.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                int index = viewPager.getCurrentItem();
                WebView webView = (WebView)viewPager.getChildAt(0).findViewById(R.id.section_label);
                webView.evaluateJavascript("jslab_share();", new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String s) {
                        Log.d("lalala", s);
                        Intent sendIntent = new Intent();
                        sendIntent.setAction(Intent.ACTION_SEND);
                        sendIntent.putExtra(Intent.EXTRA_TEXT, s);
                        sendIntent.setType("text/plain");

                        Intent shareIntent = Intent.createChooser(sendIntent, null);
                        startActivity(shareIntent);
                    }
                });
                fab.callOnClick();
            }
        });
    }

    @Override
    protected void onPause() {
        SharedPreferences pref = getSharedPreferences(getString(R.string.preferences_key), Context.MODE_PRIVATE);
        Gson gson = new Gson();
        String uuids = gson.toJson(sectionsPagerAdapter.getUUIDs());
        SharedPreferences.Editor edit = pref.edit();
        edit.putString("uuids", uuids);
        edit.apply();

        super.onPause();
    }
}