// Registers all declarative UI components into the global registry.
// Import this once at app startup (e.g. in layout.tsx or a top-level provider).

import { registerComponent } from './registry';

import { Stack } from './components/Stack';
import { Grid } from './components/Grid';
import { DTabs } from './components/DTabs';
import { DText } from './components/DText';
import { DBadge } from './components/DBadge';
import { DAvatar } from './components/DAvatar';
import { DStat } from './components/DStat';
import { DList } from './components/DList';
import { DButton } from './components/DButton';
import { DIcon } from './components/DIcon';
import { DCard } from './components/DCard';
import { DAlert } from './components/DAlert';
import { DProgress } from './components/DProgress';
import { DChart } from './components/DChart';
import { DGraph } from './components/DGraph';
import { DDataTable } from './components/DDataTable';
import { DInput } from './components/DInput';
import { DPage } from './components/DPage';
import { DSection } from './components/DSection';
import { DAccordion } from './components/DAccordion';
import { DDivider } from './components/DDivider';
import { DStats } from './components/DStats';
import { DTimeline } from './components/DTimeline';
import { DTree } from './components/DTree';
import { DKeyValue } from './components/DKeyValue';
import { DForm } from './components/DForm';
import { DSelect } from './components/DSelect';
import { DMultiSelect } from './components/DMultiSelect';
import { DToggle } from './components/DToggle';
import { DSlider } from './components/DSlider';
import { DDatePicker } from './components/DDatePicker';
import { DFileUpload } from './components/DFileUpload';
import { DBulkUpload } from './components/DBulkUpload';
import { DTextArea } from './components/DTextArea';
import { DRichEditor } from './components/DRichEditor';
import { DTagInput } from './components/DTagInput';

// Display
import { DHeader } from './components/DHeader';
import { DImage } from './components/DImage';
import { DCode } from './components/DCode';
import { DVideo } from './components/DVideo';
import { DAudio } from './components/DAudio';
import { DMarkdown } from './components/DMarkdown';
import { DEmpty } from './components/DEmpty';
import { DHtml } from './components/DHtml';

// Interactive
import { DMenu } from './components/DMenu';
import { DDialog } from './components/DDialog';
import { DTooltip } from './components/DTooltip';
import { DLink } from './components/DLink';
import { DSlideOver } from './components/DSlideOver';

// Feedback
import { DLoading } from './components/DLoading';
import { DError } from './components/DError';

export function registerAllComponents(): void {
  // Layout
  registerComponent('stack', Stack);
  registerComponent('grid', Grid);
  registerComponent('row', Stack);
  registerComponent('column', Stack);
  registerComponent('page', DPage);
  registerComponent('section', DSection);
  registerComponent('accordion', DAccordion);
  registerComponent('divider', DDivider);

  // Navigation
  registerComponent('tabs', DTabs);

  // Typography
  registerComponent('text', DText);

  // Atoms
  registerComponent('badge', DBadge);
  registerComponent('avatar', DAvatar);
  registerComponent('icon', DIcon);
  registerComponent('button', DButton);
  registerComponent('alert', DAlert);

  // Data display
  registerComponent('stat', DStat);
  registerComponent('card', DCard);
  registerComponent('list', DList);
  registerComponent('progress', DProgress);
  registerComponent('chart', DChart);
  registerComponent('graph', DGraph);
  registerComponent('data_table', DDataTable);
  registerComponent('datatable', DDataTable);
  registerComponent('stats', DStats);
  registerComponent('timeline', DTimeline);
  registerComponent('tree', DTree);
  registerComponent('keyvalue', DKeyValue);

  // Form / Input
  registerComponent('input', DInput);
  registerComponent('form', DForm);
  registerComponent('select', DSelect);
  registerComponent('multiselect', DMultiSelect);
  registerComponent('toggle', DToggle);
  registerComponent('slider', DSlider);
  registerComponent('datepicker', DDatePicker);
  registerComponent('fileupload', DFileUpload);
  registerComponent('bulkupload', DBulkUpload);
  registerComponent('textarea', DTextArea);
  registerComponent('richeditor', DRichEditor);
  registerComponent('taginput', DTagInput);

  // Display
  registerComponent('header', DHeader);
  registerComponent('image', DImage);
  registerComponent('code', DCode);
  registerComponent('markdown', DMarkdown);
  registerComponent('empty', DEmpty);
  registerComponent('html', DHtml);
  registerComponent('video', DVideo);
  registerComponent('audio', DAudio);

  // Interactive
  registerComponent('menu', DMenu);
  registerComponent('dialog', DDialog);
  registerComponent('tooltip', DTooltip);
  registerComponent('link', DLink);
  registerComponent('slideover', DSlideOver);

  // Feedback
  registerComponent('loading', DLoading);
  registerComponent('error', DError);
}
