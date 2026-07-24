import {create} from 'zustand'
import {toast} from 'sonner'
import { authService } from '@/services/authService.ts'
import type { AuthState } from '@/types/store.ts'
import { persist } from 'zustand/middleware'
import { useChatStore } from './useChatStore'

export const useAuthStore = create<AuthState>()(
    persist((set, get)=> ({
    accessToken: null,
    user: null,
    loading: false,

    setAccessToken: (accessToken) => {
        set({accessToken});
    },
    setUser: (user) => {
        set({ user });
    },
    clearState: ()=> {
        set({accessToken: null, user: null, loading: false});
        useChatStore.getState().reset();
        localStorage.clear();
        sessionStorage.clear();
    },

    signUp: async (username, password, email, firstName, lastName) => {
        try {
            set({loading: true})

            //goi api
            await authService.signUp(username, password, email, firstName, lastName);



            toast.success("Dang ky thanh cong");
        } catch (error) {
            console.error(error);
            toast.error("Dang ky that bai")
        } finally {
            set({loading: false});
        }
    },

    signIn: async (username, password) => {
        try {
            get().clearState();
            set({ loading: true });

            //goi api
            const {accessToken} = await authService.signIn(username, password);
            get().setAccessToken(accessToken);

            await get().fetchMe();
            useChatStore.getState().fetchConversations();

            toast.success("Dang nhap thanh cong");
        } catch (error) {
            console.error(error);
            toast.error("Dang nhap that bai")
        } finally {
            set({loading: false});
        }
    },

    signOut: async () => {
        try {
            get().clearState();
            await authService.signOut();
            toast.success("Dang xuat thanh cong");
        } catch (error) {
            console.error(error);
            toast.error("Dang xuat that bai")
        }
    },

    fetchMe: async () => {
        try {
            set({loading: true});
            const user = await authService.fetchMe();
            set({user});
        } catch (error) {
            console.error(error);
            set({user: null, accessToken: null});
            toast.error("Loi khi lay thong tin nguoi dung");
        } finally {
            set({loading: false});
        }
    },
    refresh: async () => {
        try {
            set({loading: true});
            const {user, fetchMe, setAccessToken} = get();
            const accessToken = await authService.refresh();
            setAccessToken(accessToken);

            if(!user) {
                await fetchMe();
            }
        } catch (error) {
            console.error(error);
            toast.error("Phien dang nhap het han");
            get().clearState();
        } finally {
            set({loading: false});
        }
    }
}),{
    name: "auth-storage",
    partialize: (state) => ({user: state.user}),
})
)