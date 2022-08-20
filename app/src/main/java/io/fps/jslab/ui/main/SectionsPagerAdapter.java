package io.fps.jslab.ui.main;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.StringRes;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentPagerAdapter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.ListIterator;

import io.fps.jslab.R;

/**
 * A [FragmentPagerAdapter] that returns a fragment corresponding to
 * one of the sections/tabs/pages.
 */
public class SectionsPagerAdapter extends FragmentPagerAdapter {

    // @StringRes
    // private static final int[] TAB_TITLES = new int[]{R.string.tab_text_1, R.string.tab_text_2};
    private final Context mContext;

    protected List<String> mUUIDs;

    int mCount = 0;

    public SectionsPagerAdapter(Context context, FragmentManager fm) {
        super(fm);
        mUUIDs = new ArrayList<String>();
        mContext = context;
    }

    @Override
    public Fragment getItem(int position) {
        // getItem is called to instantiate the fragment for the given page.
        // Return a PlaceholderFragment (defined as a static inner class below).
        return PlaceholderFragment.newInstance(position + 1);
    }

    @Nullable
    @Override
    public CharSequence getPageTitle(int position) {
        // return mContext.getResources().getString(TAB_TITLES[position]);
        // return String.format("Tab %d", position + 1);
        return mUUIDs.get(position).substring(0, 6);
    }

    @Override
    public int getCount() { return mUUIDs.size(); }

    public void addItem(String uuid) { mUUIDs.add(uuid); }

    public List<String> getUUIDs() { return mUUIDs; }
    // public void setCount(int count) { mCount = count; }
}