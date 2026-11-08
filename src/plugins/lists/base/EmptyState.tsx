import { FC } from 'react';
import { css } from '@emotion/react';
import { Theme, Typography, Box } from '@mui/material';
import { PlaylistAdd } from '@mui/icons-material';

const container = (theme: Theme) => css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${theme.typography.pxToRem(parseFloat(theme.spacing(4)))};
  min-height: 20rem;
`;

const icon = (theme: Theme) => css`
  font-size: ${theme.typography.pxToRem(48)};
  color: ${theme.palette.text.secondary};
  margin-bottom: ${theme.typography.pxToRem(parseFloat(theme.spacing(2)))};
`;

const EmptyState: FC = () => (
  <Box css={container}>
    <PlaylistAdd css={icon} />
    <Typography variant="h6" gutterBottom>
      No lists created yet
    </Typography>
    <Typography variant="body2" color="textSecondary">
      Managed lists store entries that your FlexGet tasks can consume. Create your first
      list using the + button (Add List), then add items with Add Entry.
    </Typography>
  </Box>
);

export default EmptyState;
