import { lazy } from 'react';
import UpdateIcon from '@mui/icons-material/Update';
import { registerPlugin } from 'core/plugins/registry';

export default () =>
  registerPlugin('/backfill', {
    component: lazy(
      () =>
        import(
          /* webpackChunkName: 'BackfillPlugin' */
          'plugins/backfill/Backfill'
        ),
    ),
    displayName: 'Backfill',
    icon: UpdateIcon,
    hidden: true,
  });
