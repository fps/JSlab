package io.fps.jslab.ui.main;

import androidx.arch.core.util.Function;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.Transformations;
import androidx.lifecycle.ViewModel;

public class PageViewModel extends ViewModel {

    private MutableLiveData<String> mUUID = new MutableLiveData<>();
    /*
    private LiveData<String> mText = Transformations.map(mIndex, new Function<Integer, String>() {
        @Override
        public String apply(Integer input) {
            return "Hello world from section: " + input;
        }
    });
    */

    public void setUUID(String uuid) { mUUID.setValue(uuid); }
    public String getUUID() { return mUUID.getValue(); }

    /*
    public LiveData<String> getText() {
        return mText;
    }
    */
}