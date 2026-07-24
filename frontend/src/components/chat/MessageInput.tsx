import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { Input } from "../ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";
import EmojiPicker from "./EmojiPicker";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return;

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh phải nhỏ hơn 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = ""; // cho phép chọn lại cùng một file
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const sendMessage = async () => {
    if (!value.trim() && !imageFile) return;

    const currValue = value;
    const currImage = imageFile;

    try {
      setUploading(true);

      let imgUrl: string | undefined;
      if (currImage) {
        imgUrl = await chatService.uploadMessageImage(currImage);
      }

      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.filter(
          (p) => p._id !== user._id
        )[0];
        await sendDirectMessage(otherUser._id, currValue, imgUrl);
      } else {
        await sendGroupMessage(selectedConvo._id, currValue, imgUrl);
      }

      setValue("");
      removeImage();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-background">
      {/* xem trước ảnh đã chọn */}
      {imagePreview && (
        <div className="px-3 pt-3">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="preview"
              className="max-h-32 rounded-lg border border-border/50"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 flex items-center justify-center size-5 rounded-full bg-background border border-border shadow hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 min-h-[56px]">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleSelectImage}
          className="hidden"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="hover:bg-primary/10 transition-smooth"
        >
          <ImagePlus className="size-4" />
        </Button>

        <div className="flex-1 relative">
          <Input
            onKeyPress={handleKeyPress}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Soạn tin nhắn..."
            className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
          ></Input>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-primary/10 transition-smooth"
              render={
                <div>
                  <EmojiPicker
                    onChange={(emoji: string) => setValue(`${value}${emoji}`)}
                  />
                </div>
              }
            ></Button>
          </div>
        </div>

        <Button
          onClick={sendMessage}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
          disabled={uploading || (!value.trim() && !imageFile)}
        >
          {uploading ? (
            <Loader2 className="size-4 text-white animate-spin" />
          ) : (
            <Send className="size-4 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
