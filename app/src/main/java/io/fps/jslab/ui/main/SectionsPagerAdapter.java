package io.fps.jslab.ui.main;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.StringRes;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.ListIterator;
import java.util.UUID;

import io.fps.jslab.R;

/**
 * A [FragmentPagerAdapter] that returns a fragment corresponding to
 * one of the sections/tabs/pages.
 */
public class SectionsPagerAdapter extends FragmentStateAdapter {

    // @StringRes
    // private static final int[] TAB_TITLES = new int[]{R.string.tab_text_1, R.string.tab_text_2};

    protected List<String> mUUIDs;

    int mCount = 0;

    public SectionsPagerAdapter(FragmentActivity activity) {
        super(activity);
        mUUIDs = new ArrayList<String>();
    }

    @Override
    public Fragment createFragment(int position) {
        // getItem is called to instantiate the fragment for the given page.
        // Return a PlaceholderFragment (defined as a static inner class below).
        return PlaceholderFragment.newInstance(mUUIDs.get(position));
    }

    /*
    @Nullable
    @Override
    public CharSequence getPageTitle(int position) {
        // return mContext.getResources().getString(TAB_TITLES[position]);
        // return String.format("Tab %d", position + 1);
        return mUUIDs.get(position).substring(0, 6);
    }
    */

    @Override
    public int getItemCount() { return mUUIDs.size(); }

    public void addItem(String uuid) { mUUIDs.add(uuid); }

    public List<String> getUUIDs() { return mUUIDs; }

    public void removeItem(int index) {
        if (mUUIDs.size() > (index - 1)) {
            mUUIDs.remove(index);
            notifyDataSetChanged();
        }
    }

    @Override
    public long getItemId(int position) {
        return mUUIDs.get(position).hashCode();
    }

    @Override
    public boolean containsItem(long itemId) {
        for (int index = 0; index < mUUIDs.size(); ++index) {
            if (mUUIDs.get(index).hashCode() == itemId) {
                return true;
            }
        }
        return false;
    }
    // public void setCount(int count) { mCount = count; }
}