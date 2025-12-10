# ForensicSuite User Guide

## Overview

ForensicSuite is a web-based economic loss calculator designed for forensic economists, attorneys, and expert witnesses. This guide explains how to use the software and navigate through each step of the calculation process.

## Getting Started

### Accessing the Application

1. Navigate to the application URL
2. Sign in with your credentials (or create a new account)
3. Once logged in, you'll see the ForensicSuite dashboard

### Navigation

The application uses a **wizard-style interface** with 7 main steps:

1. **Case Info** - Basic case and plaintiff information
2. **Earnings** - Earnings parameters and economic variables
3. **Narratives** - Medical and employment narratives
4. **Household** - Household services calculations
5. **Life Care** - Life care plan items
6. **Summary** - Review all calculations and scenarios
7. **Report** - Generate professional reports

You can navigate using:
- **Step buttons** at the top of the page
- **Arrow keys** (←/→) on your keyboard
- **Number keys** (1-7) to jump to specific steps
- **Next/Previous buttons** at the bottom of each step

## Step-by-Step Guide

### Step 1: Case Info

Enter basic information about the case and plaintiff:

#### Required Fields (Essential)
- **Plaintiff Name**: Full name of the injured party
- **Date of Birth**: Format MM/DD/YYYY
- **Date of Injury**: When the injury occurred
- **Date of Trial**: Trial or valuation date (used as "today" for calculations)
- **Gender**: Male/Female
- **Life Expectancy**: Years (from actuarial tables)

#### Optional Fields
- **File Number**: Case reference number
- **Attorney**: Attorney name
- **Law Firm**: Law firm name
- **Report Date**: Date of report generation
- **Education**: Plaintiff's education level
- **Marital Status**: Current marital status
- **Dependents**: Number and ages of dependents
- **Location**: City, County, State
- **Retirement Age**: Expected retirement age (default 67)
- **WLE Source**: Source of work life expectancy data
- **Life Table Source**: Source of life expectancy data
- **Jurisdiction**: Legal jurisdiction
- **Case Type**: Personal Injury or Wrongful Death

#### Calculated Values (Auto-computed)
- **Age at Injury**: Calculated from DOB and DOI
- **Age at Trial**: Calculated from DOB and DOT
- **Past Years**: Years from injury to trial
- **Years to Final Separation**: Years from trial to retirement

### Step 2: Earnings

Configure all earnings-related parameters and economic variables.

#### Essential Earnings Parameters

**Pre-Injury Earnings**
- Base annual earnings before injury
- Example: $75,000

**Post-Injury Residual Earnings**
- What plaintiff can still earn after injury
- Example: $30,000 (reduced capacity) or $0 (total disability)

**Work Life Expectancy (WLE)**
- Expected years of work from actuarial tables
- Sources: Skoog-Ciecka, Gamboa-Millimet, or custom
- Example: 25.0 years

#### Economic Variables

**Wage Growth Rate**
- Annual percentage increase in earnings
- Typical range: 2.5% - 4.5%
- Default: 3.5%

**Discount Rate**
- Rate for present value calculations
- Based on Treasury rates or market returns
- Typical range: 2.5% - 5.0%
- Default: 4.25%

**Unemployment Rate**
- Probability of unemployment periods
- Use BLS data for relevant demographics
- Typical: 3.0% - 5.0%
- Default: 4.2%

**UI Replacement Rate**
- Percentage of wages replaced by unemployment insurance
- Typical: 30% - 50%
- Default: 40%

**Fringe Benefits**
- Two modes available:
  - **Standard Mode**: Percentage rate (e.g., 21.5%)
  - **Union Mode**: Flat dollar amounts for each benefit category

**Tax Rates**
- **Federal Tax Rate**: 10% - 37% depending on income bracket
- **State Tax Rate**: 0% - 13% depending on state

#### Advanced Features

**Retirement Scenarios**
- View multiple scenarios simultaneously
- Options: WLE-based, Age 65, Age 67, Age 70
- Custom scenario: Permanent Job Incapacity (PJI)

**Era-Based Calculations (Tinari Two-Era Method)**
- Split calculations into historical (Era 1) and future (Era 2) periods
- Different wage growth rates for each era
- Useful when past wage growth differs from expected future

**Past Actual Earnings**
- Record actual earnings for past years
- Override theoretical calculations with real data
- Enter by calendar year

**Wrongful Death Mode**
- Applies personal consumption adjustments
- Different rates for Era 1 and Era 2
- Typical range: 20% - 30%

### Step 3: Narratives

Provide detailed narrative descriptions (optional but recommended for reports):

**Medical Summary**
- Nature and extent of injuries
- Treatment history
- Current medical status
- Permanent impairments
- Future medical needs

**Employment History**
- Pre-injury employment
- Job duties and responsibilities
- Skills and qualifications
- Career trajectory
- Industry experience

**Pre-Injury Earning Capacity**
- Factors supporting earning capacity
- Career advancement potential
- Comparable positions
- Industry standards

**Post-Injury Earning Capacity**
- Current functional limitations
- Residual capacities
- Vocational assessment findings
- Job placement prospects

**Functional Limitations**
- Physical restrictions
- Cognitive limitations
- Psychological effects
- Daily living impacts

### Step 4: Household Services

Calculate the value of household services the plaintiff can no longer perform.

#### Configuration

**Enable Household Services**
- Toggle on to include in calculations

**Hours Per Week**
- Estimated hours of household services needed
- Typical range: 10-30 hours/week
- Consider all service types

**Hourly Rate**
- Replacement cost per hour
- Use local market rates for domestic services
- Typical: $20-$35/hour

**Growth Rate**
- Annual increase in service costs
- Typical: 2.5% - 3.5%

**Discount Rate**
- Can match earnings discount or use separate rate
- Typical: 4.0% - 4.5%

#### Service Categories to Consider

- Childcare and supervision
- Home maintenance and repairs
- Meal preparation and cleanup
- Shopping and errands
- Transportation services
- Yard work and landscaping
- Home management

#### Example Calculation

```
15 hours/week × $25/hour = $375/week
$375 × 52 weeks = $19,500/year
Over 28.6 years with 3% growth and 4.25% discount
Present Value ≈ $423,000
```

### Step 5: Life Care Plan

Enter all future medical and care expenses from the life care plan.

#### Adding Items

Click "Add Item" to create a new expense entry:

**Item Details**
- **Name**: Description of item/service
- **Category**: Select from CPI categories (affects inflation rate)
- **Base Cost**: Current cost (in today's dollars)
- **Frequency**: One-time, Annual, or Recurring
- **Start Year**: When expense begins (Year 1 = first year after trial)
- **Duration**: Number of years expense continues
- **CPI Rate**: Auto-filled based on category (can override)

**Frequency Options**

1. **One-Time**
   - Occurs once in the start year
   - Examples: Home modification, vehicle purchase

2. **Annual**
   - Occurs every year for the duration
   - Examples: Medications, therapy sessions

3. **Recurring**
   - Occurs at specified intervals
   - Set recurrence interval (e.g., every 3 years)
   - Examples: Equipment replacement, periodic surgeries

4. **Custom Years**
   - Occurs only in specified years
   - Select individual years from a list
   - Examples: Surgeries planned for specific years

#### CPI Categories and Rates

| Category | Default Rate |
|----------|--------------|
| Physician Evaluations & Home Care | 2.88% |
| Rx / Medical Commodities | 1.65% |
| Hospital/Surgical Services | 4.07% |
| Therapy & Treatments | 1.62% |
| Transportation | 4.32% |
| Home Modifications | 4.16% |
| Education/Training | 2.61% |
| Custom Rate | (enter manually) |

#### Managing Items

- **Edit**: Click the item to modify details
- **Delete**: Remove unwanted items
- **Duplicate**: Copy an item as a template
- **Reorder**: Drag items to organize

#### Calculations Display

For each item, the software shows:
- Nominal Total: Sum without discounting
- Present Value: Discounted to trial date
- Years active: Which years the expense occurs

Total LCP Present Value is automatically calculated and included in the grand total.

### Step 6: Summary

Review all calculations, scenarios, and generate visualizations.

#### Summary Tables

**Loss Summary by Category**
| Category | Past Value | Future (PV) | Total |
|----------|------------|-------------|-------|
| Lost Earning Capacity | $XXX | $XXX | $XXX |
| Household Services | — | $XXX | $XXX |
| Life Care Plan | — | $XXX | $XXX |
| **GRAND TOTAL** | **$XXX** | **$XXX** | **$XXX** |

**Adjusted Earnings Factor Breakdown**
Shows step-by-step Tinari calculation:
- Work Life Factor
- Unemployment Factor
- After-Tax Factor
- Fringe Benefit Factor
- Final AIF

**Retirement Scenario Comparison**
Compare damages under different retirement assumptions:
- Shows YFS, WLF, and total damages for each scenario
- Helps illustrate range of possible outcomes
- Toggle scenarios on/off for report inclusion

#### Detailed Schedules

**Past Earnings Schedule**
- Year-by-year breakdown from injury to trial
- Shows gross earnings, net loss (no discounting for past)
- Highlights years with actual earnings data

**Future Earnings Schedule**
- Year-by-year projections from trial to retirement
- Shows gross earnings, net loss, present value
- Cumulative totals

**Life Care Plan Schedule** (if applicable)
- Year-by-year itemization
- Shows inflation-adjusted costs and present values

**Household Services Schedule** (if applicable)
- Annual values with growth and discounting

#### Charts and Visualizations

- **Loss by Category**: Pie chart showing proportion of each component
- **Timeline**: Visual representation of past vs. future losses
- **Scenario Comparison**: Bar chart comparing different retirement scenarios
- **Present Value Over Time**: Shows how future losses discount

### Step 7: Report

Generate professional reports for distribution.

#### Report Formats

**PDF Report**
- Professional formatted document
- Includes all tables, charts, and narratives
- Suitable for court filing
- Cannot be edited after generation

**Word Document (.docx)**
- Editable format
- Allows customization before final distribution
- Maintains formatting and tables
- Can add additional sections

**Excel Spreadsheet (.xlsx)**
- Detailed year-by-year calculations
- Multiple worksheets for each component
- Formulas visible for transparency
- Suitable for expert testimony preparation

**Print**
- Direct browser printing
- Optimized for letter-size paper
- Includes page breaks in appropriate places

#### Report Contents

Professional reports include:

1. **Title Page**
   - Case identification
   - Plaintiff information
   - Report date
   - Prepared by/for information

2. **Certification**
   - Statement of independence
   - Professional qualifications
   - Ethical compliance

3. **Opinion of Economic Losses**
   - Summary table of all damages
   - Total past and future losses

4. **Background Facts and Assumptions**
   - Plaintiff demographics
   - Injury details
   - Case timeline
   - Medical summary
   - Employment history

5. **Methodology**
   - Tinari Algebraic Method explanation
   - Step-by-step AEF calculation
   - Economic variables used

6. **Earnings Damage Schedule**
   - Complete year-by-year breakdown
   - Past and future losses

7. **Retirement Scenario Analysis**
   - Multiple scenario comparison
   - Sensitivity analysis

8. **Life Care Plan Summary** (if applicable)
   - Itemized expenses
   - Present value calculations

9. **Household Services** (if applicable)
   - Service description
   - Valuation methodology

10. **Statement of Ethical Principles**
    - NAFE/AREA compliance
    - Professional standards

#### Validation Checks

Before generating a report, the software performs validation:

✅ **Essential Fields Complete**
- Plaintiff name
- Date of birth
- Date of injury
- Date of trial
- Life expectancy
- Base earnings
- Work life expectancy

⚠️ **Warnings**
- Missing optional information
- Unusual economic assumptions
- Data inconsistencies

❌ **Errors**
- Missing required fields
- Invalid dates
- Negative values where not allowed

Click on any warning/error to jump to the relevant step for correction.

#### Exporting and Saving

**Export History**
- Tracks all generated reports
- Shows format, date, plaintiff name, and total damages
- Useful for billing and documentation

**Auto-Save**
- Cases auto-save every 2 minutes to the cloud
- Local browser storage provides additional backup
- Green cloud icon indicates successful sync

## Case Management

### Saving Cases

**Manual Save**
- Click "Save Case" in the case manager
- Enter a descriptive case name
- Cases are saved to both local storage and cloud

**Auto-Save**
- Automatic cloud backup every 2 minutes
- Local browser auto-save on every change
- Save indicator shows last save time

### Loading Cases

**From Cloud Storage**
- Access saved cases from any device
- Sorted by last modified date
- Shows case summary (plaintiff, date, total)

**From Local Storage**
- Accessible only on current device
- Survives browser restarts
- Independent of cloud storage

**From Import**
- Import cases from JSON files
- Useful for:
  - Case templates
  - Sharing between users
  - Backup/restore

### Creating New Cases

Click "New Case" to start fresh:
- Clears all fields to defaults
- Preserves economic variable preferences
- Retains user settings

### Dashboard

View all your cases in one place:
- Sortable by date, plaintiff, or total
- Search/filter functionality
- Quick access to recent cases
- Summary statistics

## Advanced Features

### Keyboard Shortcuts

- **Arrow Keys (←/→)**: Navigate between steps
- **Number Keys (1-7)**: Jump to specific step
- **Ctrl+S** / **Cmd+S**: Quick save case (if implemented)
- **Tab**: Move between form fields
- **Enter**: Submit/advance in forms

### Theme Toggle

Switch between light and dark modes:
- Located in top navigation bar
- Preference saved per user
- Affects entire application

### User Settings

Access via user menu (top right):
- Profile information
- Email preferences
- Password management
- Account settings

### Data Import/Export

**Import**
- JSON format for case data
- Excel templates for bulk LCP entries
- Supports legacy format versions

**Export**
- JSON for case backup/sharing
- CSV for data analysis
- Excel for detailed review

### AI Assistant (If Available)

The AI assistant can help with:
- Explaining calculations
- Suggesting typical values
- Reviewing case for completeness
- Answering methodology questions

## Tips and Best Practices

### Economic Variables

1. **Use Current Data**: Update discount rates and unemployment rates quarterly
2. **Document Sources**: Note where you obtained WLE, life expectancy, etc.
3. **Consider Jurisdiction**: Some states have specific requirements
4. **Review Fringe Benefits**: Ensure fringe rate matches plaintiff's actual benefits

### Narratives

1. **Be Specific**: Detailed narratives strengthen reports
2. **Use Medical Records**: Quote or cite specific medical findings
3. **Employment Documentation**: Reference job descriptions, pay stubs, tax returns
4. **Avoid Editorializing**: Stick to facts and professional opinions

### Life Care Plans

1. **Use Professional LCPs**: Work with qualified life care planners
2. **Document All Items**: Include justification for each expense
3. **Review Categories**: Ensure correct CPI category for accurate inflation
4. **Consider Timing**: Match start years to medical prognosis

### Scenario Analysis

1. **Include Multiple Scenarios**: Shows range of outcomes
2. **Use Conservative Assumptions**: For defendant's perspective scenarios
3. **Document Selection**: Explain why certain scenarios are more likely
4. **Compare to Standards**: Check against age-specific retirement norms

### Quality Control

Before finalizing:
- ✅ Review all essential fields
- ✅ Verify dates are logical (DOB < DOI < DOT)
- ✅ Check calculations match expectations
- ✅ Review narratives for completeness
- ✅ Proofread plaintiff/attorney names
- ✅ Confirm case type (PI vs. WD)
- ✅ Test report generation
- ✅ Save final version

## Troubleshooting

### Common Issues

**"Essential fields incomplete" warning**
- Solution: Check the quick start checklist and click "Jump to next needed"

**Calculations seem incorrect**
- Verify all economic variables are entered correctly
- Check that dates are in proper order
- Ensure WLE is reasonable for age and occupation
- Review fringe benefits calculation

**Report generation fails**
- Check for very long narratives (may cause formatting issues)
- Ensure all required fields are complete
- Try different export format
- Check browser console for errors

**Case won't save**
- Check internet connection for cloud save
- Verify you're logged in
- Try manual save button
- Check browser local storage isn't full

**Data looks wrong after loading**
- Verify correct case was loaded
- Check for legacy format conversion issues
- Re-enter any suspicious values
- Compare to export/backup if available

### Getting Help

1. **Check Documentation**: Review [CALCULATIONS.md](./CALCULATIONS.md) for methodology
2. **User Guide**: This document for interface help
3. **Support**: Contact support team with specific questions
4. **Training**: Consider professional training sessions
5. **Community**: Connect with other forensic economists using the software

## Professional Standards

This software is designed to comply with:

- **NAFE** (National Association of Forensic Economics) standards
- **AREA** (American Rehabilitation Economics Association) guidelines
- Court-accepted forensic economics methodologies
- Generally accepted accounting principles (GAAP) where applicable

Always review calculations independently and document your methodology in accordance with professional standards in your jurisdiction.

## Appendix: Calculation Reference

For detailed explanations of all calculations, formulas, and methodologies, see:

**[CALCULATIONS.md](./CALCULATIONS.md)** - Complete technical documentation

Key calculation methods:
- Tinari Algebraic Method for AIF
- Present value discounting with mid-year convention
- Work life factor calculations
- Era-based split calculations
- Personal consumption adjustments for wrongful death
- Medical inflation by CPI category

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Software**: ForensicSuite V10
