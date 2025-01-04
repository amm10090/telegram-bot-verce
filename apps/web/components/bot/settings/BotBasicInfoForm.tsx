import { useEffect } from "react";
import { Input, Textarea } from "@nextui-org/react";
import { useIntl } from "react-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// 定义表单验证模式
const formSchema = z.object({
  name: z.string()
    .min(1, "名称不能为空")
    .max(64, "名称不能超过64个字符"),
  description: z.string()
    .max(512, "介绍不能超过512个字符")
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BotBasicInfoFormProps {
  bot: any;
  onSubmit?: (data: FormData) => void;
}

export function BotBasicInfoForm({ bot, onSubmit }: BotBasicInfoFormProps) {
  const intl = useIntl();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bot.name || "",
      description: bot.description || "",
    },
  });

  // 监听描述字段的长度
  const description = watch("description");
  const descriptionLength = description?.length || 0;

  // 重置表单
  useEffect(() => {
    reset({
      name: bot.name || "",
      description: bot.description || "",
    });
  }, [bot, reset]);

  // 处理表单提交
  const handleFormSubmit = (data: FormData) => {
    onSubmit?.(data);
  };

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
          label={intl.formatMessage({ id: "bot.form.description.label" })}
          placeholder={intl.formatMessage({ id: "bot.form.description.placeholder" })}
          errorMessage={errors.description?.message}
          isInvalid={!!errors.description}
          maxLength={512}
          description={`${descriptionLength}/512`}
        />
      </div>
    </form>
  );
} 