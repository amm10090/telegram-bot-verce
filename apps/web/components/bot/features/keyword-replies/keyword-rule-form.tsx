import { useIntl } from "react-intl";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Switch
} from "@nextui-org/react";
import type { AutoReplyRule } from "@/types/bot";

interface KeywordRuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  rule: AutoReplyRule | null;
  bot: any;
}

export function KeywordRuleForm({
  isOpen,
  onClose,
  rule,
  bot
}: KeywordRuleFormProps) {
  const intl = useIntl();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
    >
      <ModalContent>
        <ModalHeader>
          {intl.formatMessage({ 
            id: rule 
              ? "bots.features.keywords.modal.editRule"
              : "bots.features.keywords.modal.addRule"
          })}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label={intl.formatMessage({ id: "bots.features.keywords.modal.form.name.label" })}
              placeholder={intl.formatMessage({ id: "bots.features.keywords.modal.form.name.placeholder" })}
              defaultValue={rule?.name}
            />
            <Select
              label={intl.formatMessage({ id: "bots.features.keywords.modal.form.type.label" })}
              defaultSelectedKeys={rule ? [rule.type] : ['keyword']}
            >
              <SelectItem key="keyword" value="keyword">
                {intl.formatMessage({ id: "bots.features.keywords.modal.form.type.keyword" })}
              </SelectItem>
              <SelectItem key="regex" value="regex">
                {intl.formatMessage({ id: "bots.features.keywords.modal.form.type.regex" })}
              </SelectItem>
            </Select>
            <Textarea
              label={intl.formatMessage({ id: "bots.features.keywords.modal.form.triggers.label" })}
              placeholder={intl.formatMessage({ id: "bots.features.keywords.modal.form.triggers.placeholder" })}
              defaultValue={rule?.triggers.join('\n')}
            />
            <Input
              type="number"
              label={intl.formatMessage({ id: "bots.features.keywords.modal.form.priority.label" })}
              placeholder={intl.formatMessage({ id: "bots.features.keywords.modal.form.priority.placeholder" })}
              defaultValue={String(rule?.priority || 0)}
            />
            <div className="flex items-center gap-2">
              <Switch
                defaultSelected={rule?.isEnabled ?? true}
              />
              <span>
                {intl.formatMessage({ id: "bots.features.keywords.modal.form.enabled" })}
              </span>
            </div>
            <Textarea
              label={intl.formatMessage({ id: "bots.features.keywords.modal.form.response.label" })}
              placeholder={intl.formatMessage({ id: "bots.features.keywords.modal.form.response.placeholder" })}
              defaultValue={rule?.response?.content}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={onClose}
          >
            {intl.formatMessage({ id: "bots.features.keywords.modal.actions.cancel" })}
          </Button>
          <Button
            color="primary"
            onPress={onClose}
          >
            {intl.formatMessage({ id: "bots.features.keywords.modal.actions.save" })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 