import { useState } from "react";
import { useIntl } from "react-intl";
import {
  Modal, 
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure
} from "@nextui-org/react";
import type { AutoReplyRule } from "@/types/bot";
import { KeywordRuleForm } from "./keyword-rule-form";
import { KeywordRuleList } from "./keyword-rule-list";

interface KeywordRepliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: any; // 后续替换为具体的Bot类型
}

export function KeywordRepliesModal({
  isOpen,
  onClose,
  bot
}: KeywordRepliesModalProps) {
  const intl = useIntl();
  
  // 表单模态框状态
  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose
  } = useDisclosure();

  // 当前编辑的规则
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);

  // 处理添加/编辑
  const handleEdit = (rule?: AutoReplyRule) => {
    setEditingRule(rule || null);
    onFormOpen();
  };

  return (
    <>
      <Modal 
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {intl.formatMessage({ id: "bots.features.keywords.modal.title" })}
          </ModalHeader>
          <ModalBody>
            <KeywordRuleList
              bot={bot}
              onEdit={handleEdit}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={() => handleEdit()}
            >
              {intl.formatMessage({ id: "bots.features.keywords.modal.addRule" })}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <KeywordRuleForm
        isOpen={isFormOpen}
        onClose={onFormClose}
        rule={editingRule}
        bot={bot}
      />
    </>
  );
} 