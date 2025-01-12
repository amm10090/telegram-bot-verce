import { useEffect, useState } from "react";
import { Input, Textarea, Spinner } from "@nextui-org/react";
import { useIntl } from "react-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@workspace/ui/hooks/use-toast";
import * as z from "zod";

// 定义表单验证模式
const formSchema = z.object({
  name: z.string()
    .min(1, "名称不能为空")
    .max(64, "名称不能超过64个字符"),
  description: z.string()
    .max(120, "简短描述不能超过120个字符")
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BotBasicInfoFormProps {
  bot: any;
  onSubmit?: (data: FormData) => void;
}

export function BotBasicInfoForm({ bot, onSubmit }: BotBasicInfoFormProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // 监听描述字段的长度
  const description = watch("description");
  const descriptionLength = description?.length || 0;

  // 加载当前设置
  useEffect(() => {
    const loadSettings = async () => {
      if (!bot?.id) return;

      try {
        setIsLoading(true);
        
        // 获取名称
        const nameResponse = await fetch(`/api/bot/telegram/bots/${bot.id}/name`);
        const nameData = await nameResponse.json();
        
        // 获取描述
        const descResponse = await fetch(`/api/bot/telegram/bots/${bot.id}/shortDescription`);
        const descData = await descResponse.json();

        if (nameData.success && descData.success) {
          reset({
            name: nameData.data.name || "",
            description: descData.data.short_description || "",
          });
        } else {
          throw new Error("加载设置失败");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "加载设置失败",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [bot?.id, reset, toast]);

  // 处理表单提交
  const handleFormSubmit = (data: FormData) => {
    onSubmit?.(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Spinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Input
          {...register("name")}
          label={intl.formatMessage({ id: "bot.form.name.label" })}
          placeholder={intl.formatMessage({ id: "bot.form.name.placeholder" })}
          errorMessage={errors.name?.message}
          isInvalid={!!errors.name}
        />
      </div>

      <div>
        <Textarea
          {...register("description")}
          label={intl.formatMessage({ id: "bot.form.shortDescription.label" })}
          placeholder={intl.formatMessage({ id: "bot.form.shortDescription.placeholder" })}
          errorMessage={errors.description?.message}
          isInvalid={!!errors.description}
          maxLength={120}
          description={`${descriptionLength}/120`}
        />
      </div>
    </form>
  );
} 