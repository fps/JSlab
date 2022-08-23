package io.fps.jslab;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;

import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import androidx.annotation.NonNull;
import androidx.viewpager.widget.ViewPager;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;

import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;

import java.util.List;
import java.util.UUID;

import io.fps.jslab.ui.main.SectionsPagerAdapter;
import io.fps.jslab.databinding.ActivityMainBinding;

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