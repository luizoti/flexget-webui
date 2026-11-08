import { FC, useCallback, useMemo } from 'react';
import { Typography, Tooltip, IconButton } from '@mui/material';
import { Check, Clear, DoneAll, ClearAll } from '@mui/icons-material';
import { useFlexgetAPI } from 'core/api';
import { Method } from 'utils/fetch';
import { useContainer } from 'unstated-next';
import { PendingListEntry, Operation, SortBy } from './types';
import { createPluginContainer } from '../base/hooks/api';
import { EntryContainer, actions } from '../base/hooks/entry';
import { ListContainer } from '../base/hooks/list';

export const useEntryOperation = (entryId: number) => {
  const [{ listId }] = useContainer(ListContainer);
  const [, dispatch] = useContainer(EntryContainer);
  const [state, request] = useFlexgetAPI<PendingListEntry>(
    `/pending_list/${listId}/entries/${entryId}`,
    Method.Put,
  );

  const doOperation = useCallback(
    async (operation: Operation) => {
      const resp = await request({ operation });
      if (resp.ok) {
        dispatch(actions.updateEntry(resp.data));
      }
      return resp;
    },
    [dispatch, request],
  );

  return [state, doOperation] as const;
};

export const useEntryBulkOperation = () => {
  const [{ listId }] = useContainer(ListContainer);
  const [{ selectedIds }, dispatch] = useContainer(EntryContainer);
  const [state, request] = useFlexgetAPI<PendingListEntry[]>(
    `/pending_list/${listId}/entries/batch`,
    Method.Put,
  );

  const doOperation = useCallback(
    async (operation: Operation) => {
      const ids = [...selectedIds];
      const resp = await request({
        operation,
        ids,
      });

      if (resp.ok) {
        dispatch(actions.updateEntries(resp.data));
      }
      return resp;
    },
    [dispatch, request, selectedIds],
  );
  return [state, doOperation] as const;
};

interface Props {
  entry: PendingListEntry;
}

export const ActionsLeft: FC<Props> = ({ entry }) =>
  entry.approved ? (
    <Typography variant="overline" color="primary">
      Approved
    </Typography>
  ) : null;

export const Actions: FC<Props> = ({ entry }) => {
  const [{ loading }, doOperation] = useEntryOperation(entry.id);
  const { title, label, Icon, onClick } = entry.approved
    ? {
        title: 'Reject',
        label: 'reject',
        Icon: Clear,
        onClick: () => doOperation(Operation.Reject),
      }
    : {
        title: 'Approve',
        label: 'approve',
        Icon: Check,
        onClick: () => doOperation(Operation.Approve),
      };

  return (
    <Tooltip title={title} placement="top">
      <IconButton aria-label={label} disabled={loading} onClick={onClick}>
        <Icon />
      </IconButton>
    </Tooltip>
  );
};

export const PendingListContainer = createPluginContainer(() => {
  return {
    sortByOptions: useMemo(
      () => [
        {
          value: SortBy.Added,
          label: 'Date Added',
        },
        {
          value: SortBy.Title,
          label: 'Title',
        },
        {
          value: SortBy.URL,
          label: 'URL',
        },
        {
          value: SortBy.Approved,
          label: 'Approved',
        },
      ],
      [],
    ),
    card: {
      ActionsLeft,
      Actions,
    },
    useMenuProps: () => {
      const [{ loading }, doBulkOperation] = useEntryBulkOperation();
      return useMemo(
        () => [
          {
            name: 'Approve All',
            onClick: () => doBulkOperation(Operation.Approve),
            Icon: DoneAll,
            disabled: loading,
          },
          {
            name: 'Reject All',
            onClick: () => doBulkOperation(Operation.Reject),
            Icon: ClearAll,
            disabled: loading,
          },
        ],
        [doBulkOperation, loading],
      );
    },
    addEntryProps: useMemo(
      () => [
        {
          label: 'Entry Title',
          name: 'title',
        },
        {
          label: 'Entry URL',
          name: 'originalUrl',
        },
      ],
      [],
    ),
    api: {
      list: {
        useGet: () => useFlexgetAPI('/pending_list'),
        useAdd: () => useFlexgetAPI('/pending_list', Method.Post),
        useRemove: (listId?: number) => useFlexgetAPI(`/pending_list/${listId}`, Method.Delete),
      },
      entry: {
        useGet: (listId: number, query: string) =>
          useFlexgetAPI(`/pending_list/${listId}/entries?${query}`),
        useAdd: (listId?: number) => useFlexgetAPI(`/pending_list/${listId}/entries`, Method.Post),
        useRemove: (listId: number, pendingId: number) =>
          useFlexgetAPI(`/pending_list/${listId}/entries/${pendingId}`, Method.Delete),
        useRemoveBulk: (listId: number) =>
          useFlexgetAPI(`/pending_list/${listId}/entries/batch`, Method.Delete),
      },
    },
  };
});
