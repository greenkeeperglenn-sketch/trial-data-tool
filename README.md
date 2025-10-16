# Trial Data Collection Tool

Professional field trial data collection and analysis application.

## Features

- ✅ Multi-trial management with auto-save
- ✅ Randomized Complete Block Design (RCBD)
- ✅ Color-coded data entry based on actual values
- ✅ Photo uploads per plot
- ✅ Assessment notes
- ✅ ANOVA & Fisher's LSD statistical analysis
- ✅ Box plots showing all dates
- ✅ CSV export (raw data & summary tables)
- ✅ JSON backup/restore
- ✅ Offline capable (browser storage)
- ✅ Mobile-optimized for field use

## Quick Start

### Local Development

1. Clone this repository
2. Install dependencies:
```bash
   npm install
```
3. Run development server:
```bash
   npm run dev
```
4. Open browser to `http://localhost:3000`

### Deploy to Vercel

1. Push this code to your GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repo
5. Click "Deploy"
6. Done! Your app is live

## Usage

### Creating a Trial

1. Click "Create New Trial"
2. Set up blocks, treatments, replicates
3. Add assessment types with min/max scales
4. Click "Generate Trial Layout"

### Data Entry

1. Add assessment dates
2. Navigate between dates with arrow buttons
3. Enter data in Field Map view (color-coded)
4. Upload photos directly to plots
5. Add notes in Notes view

### Analysis

1. Switch to Analysis view
2. See ANOVA results for all dates
3. View box plots comparing treatments over time
4. Check Summary view for treatment means

### Exporting

- **Export Data**: Raw CSV with all plot values
- **Export Summary**: Treatment means with standard errors
- **Backup**: Complete trial as JSON (can re-import later)

## Data Storage

- All data stored in browser localStorage
- Auto-saves on every change
- Export JSON backups for safety
- No server required

## Future Enhancements (Phase 2+)

- Cloud database with Supabase
- Multi-user sync
- AI note transcription
- Client portal (read-only access)
- Advanced reporting

## Support

For issues or questions, contact: [your-email]

## License

Proprietary - Internal Use Only
