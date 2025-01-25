import { useIntl } from "react-intl";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Button,
  Switch,
  Tooltip
} from "@nextui-org/react";
import { Edit2, Trash2 } from "lucide-react";
import type { AutoReplyRule } from "@/types/bot";

interface KeywordRuleListProps {
  bot: any;
  onEdit: (rule: AutoReplyRule) => void;
  onDelete?: (rule: AutoReplyRule) => void;
  onToggle?: (rule: AutoReplyRule, enabled: boolean) => void;
}

export function KeywordRuleList({
  bot,
  onEdit,
  onDelete,
  onToggle
}: KeywordRuleListProps) {
  const intl = useIntl();

  return (
    <Table>
      <TableHeader>
        <TableColumn>{intl.formatMessage({ id: "bots.features.keywords.modal.table.name" })}</TableColumn>
        <TableColumn>{intl.formatMessage({ id: "bots.features.keywords.modal.table.type" })}</TableColumn>
        <TableColumn>{intl.formatMessage({ id: "bots.features.keywords.modal.table.triggers" })}</TableColumn>
        <TableColumn>{intl.formatMessage({ id: "bots.features.keywords.modal.table.priority" })}</TableColumn>
        <TableColumn>{intl.formatMessage({ id: "bots.features.keywords.modal.table.status" })}</TableColumn>
        <TableColumn>{intl.formatMessage({ id: "bots.features.keywords.modal.table.actions" })}</TableColumn>
      </TableHeader>
      <TableBody>
        {bot.autoReplies?.map((rule: AutoReplyRule) => (
          <TableRow key={rule.name}>
            <TableCell>{rule.name}</TableCell>
            <TableCell>
              <Chip 
                color={rule.type === 'keyword' ? 'primary' : 'secondary'}
                variant="flat"
              >
                {intl.formatMessage({ 
                  id: `bots.features.keywords.modal.form.type.${rule.type}`
                })}
              </Chip>
            </TableCell>
            <TableCell>{rule.triggers.join(', ')}</TableCell>
            <TableCell>{rule.priority}</TableCell>
            <TableCell>
              <Switch 
                isSelected={rule.isEnabled}
                onValueChange={(checked) => onToggle?.(rule, checked)}
                size="sm"
              />
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Tooltip content={intl.formatMessage({ id: "bots.features.keywords.modal.actions.edit" })}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onEdit(rule)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip 
                  content={intl.formatMessage({ id: "bots.features.keywords.modal.actions.delete" })}
                  color="danger"
                >
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => onDelete?.(rule)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 