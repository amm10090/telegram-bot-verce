import { useState } from "react";
import { Avatar, Button } from "@nextui-org/react";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { useIntl } from "react-intl";
import { Upload } from "lucide-react";

interface BotAvatarUploadProps {
  bot: any;
  onUpload?: (url: string) => void;
}

export function BotAvatarUpload({ bot, onUpload }: BotAvatarUploadProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(bot.avatar || "");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "avatar.upload.error.invalidType.title" }),
        description: intl.formatMessage({ id: "avatar.upload.error.invalidType.description" }),
      });
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "avatar.upload.error.tooLarge.title" }),
        description: intl.formatMessage({ id: "avatar.upload.error.tooLarge.description" }),
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // 创建预览URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // TODO: 实现文件上传逻辑
      // const formData = new FormData();
      // formData.append("avatar", file);
      // const response = await fetch(`/api/bot/telegram/bots/${bot.id}/avatar`, {
      //   method: "POST",
      //   body: formData,
      // });
      
      // if (!response.ok) throw new Error("Upload failed");
      // const { url } = await response.json();
      
      // onUpload?.(url);
      
      toast({
        title: intl.formatMessage({ id: "avatar.upload.success.title" }),
        description: intl.formatMessage({ id: "avatar.upload.success.description" }),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "avatar.upload.error.failed.title" }),
        description: intl.formatMessage({ id: "avatar.upload.error.failed.description" }),
      });
      // 上传失败时恢复原头像
      setPreviewUrl(bot.avatar || "");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <Avatar
        src={previewUrl}
        className="w-24 h-24"
        fallback={bot.name?.[0] || "B"}
      />
      
      <div className="flex flex-col gap-2">
        <Button
          variant="bordered"
          size="sm"
          className="relative"
          isLoading={isUploading}
          isDisabled={isUploading}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Upload className="w-4 h-4 mr-2" />
          {intl.formatMessage({ id: "avatar.upload.button" })}
        </Button>
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage({ id: "avatar.upload.hint" })}
        </p>
      </div>
    </div>
  );
} 