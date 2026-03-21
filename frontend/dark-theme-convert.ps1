Set-Location "d:\Dev\work\tobacco-supabase\frontend"

$excludeFiles = @(
  "src\components\Header.tsx",
  "src\components\Footer.tsx",
  "src\components\ReviewCard.tsx",
  "src\components\ReviewForm.tsx"
)

$files = Get-ChildItem -Path "src" -Include "*.tsx" -Recurse | Where-Object {
  $rel = $_.FullName.Replace("d:\Dev\work\tobacco-supabase\frontend\","")
  $excludeFiles -notcontains $rel
}

$replacements = @(
  @{o='bg-gradient-to-br from-gray-50 via-orange-50/30 to-white';n='bg-[#121212]'},
  @{o='bg-gradient-to-br from-gray-50 via-white to-gray-50';n='bg-[#121212]'},
  @{o='bg-gradient-to-br from-gray-50 to-white';n='bg-[#121212]'},
  @{o='bg-gradient-to-b from-gray-50 to-white';n='bg-[#121212]'},
  @{o='bg-gray-50/80';n='bg-[#1a1a1a]'},
  @{o='bg-gray-50/50';n='bg-[#1a1a1a]'},
  @{o='bg-gray-50';n='bg-[#121212]'},
  @{o='bg-white/80';n='bg-[#1E1E1E]/80'},
  @{o='bg-white/95';n='bg-[#1E1E1E]/95'},
  @{o='bg-white/90';n='bg-[#1E1E1E]/90'},
  @{o='bg-white';n='bg-[#1E1E1E]'},
  @{o='bg-gray-100';n='bg-[#252525]'},
  @{o='bg-gray-200';n='bg-[#2A2A2A]'},
  @{o='text-gray-900';n='text-[#F5F5F5]'},
  @{o='text-gray-800';n='text-[#E0E0E0]'},
  @{o='text-gray-700';n='text-[#C0C0C0]'},
  @{o='text-gray-600';n='text-[#A0A0A0]'},
  @{o='text-gray-500';n='text-[#A0A0A0]'},
  @{o='text-gray-400';n='text-[#666]'},
  @{o='border-gray-100';n='border-[#2A2A2A]'},
  @{o='border-gray-200';n='border-[#2A2A2A]'},
  @{o='border-gray-300';n='border-[#333]'},
  @{o='divide-gray-100';n='divide-[#2A2A2A]'},
  @{o='divide-gray-200';n='divide-[#2A2A2A]'},
  @{o='bg-orange-500/5';n='bg-gold-500/5'},
  @{o='bg-orange-500/10';n='bg-gold-500/10'},
  @{o='bg-orange-500/15';n='bg-gold-500/15'},
  @{o='bg-orange-500/20';n='bg-gold-500/20'},
  @{o='bg-orange-500/80';n='bg-gold-500/80'},
  @{o='bg-orange-500/90';n='bg-gold-500/90'},
  @{o='bg-orange-50';n='bg-gold-500/10'},
  @{o='bg-orange-100';n='bg-gold-500/15'},
  @{o='bg-orange-500';n='bg-gold-500'},
  @{o='bg-orange-600';n='bg-gold-600'},
  @{o='hover:bg-orange-50';n='hover:bg-gold-500/10'},
  @{o='hover:bg-orange-100';n='hover:bg-gold-500/15'},
  @{o='hover:bg-orange-500';n='hover:bg-gold-500'},
  @{o='hover:bg-orange-600';n='hover:bg-gold-600'},
  @{o='hover:bg-orange-500/80';n='hover:bg-gold-500/80'},
  @{o='text-orange-500';n='text-gold-500'},
  @{o='text-orange-600';n='text-gold-600'},
  @{o='text-orange-700';n='text-gold-700'},
  @{o='text-orange-300/80';n='text-gold-300/80'},
  @{o='text-orange-300';n='text-gold-300'},
  @{o='hover:text-orange-500';n='hover:text-gold-500'},
  @{o='hover:text-orange-600';n='hover:text-gold-600'},
  @{o='border-orange-200';n='border-gold-500/30'},
  @{o='border-orange-300';n='border-gold-500/40'},
  @{o='border-orange-500';n='border-gold-500'},
  @{o='ring-orange-500';n='ring-gold-500'},
  @{o='shadow-orange-500';n='shadow-gold-500'},
  @{o='from-orange-500';n='from-gold-500'},
  @{o='to-orange-600';n='to-gold-600'},
  @{o='to-orange-700';n='to-gold-700'},
  @{o='via-orange-500';n='via-gold-500'},
  @{o='focus:border-orange-300';n='focus:border-gold-500/40'},
  @{o='focus:ring-orange-500/20';n='focus:ring-gold-500/20'},
  @{o='focus:ring-orange-500';n='focus:ring-gold-500'},
  @{o='focus-visible:ring-orange-500';n='focus-visible:ring-gold-500'},
  @{o='bg-green-50';n='bg-green-900/20'},
  @{o='border-green-200';n='border-green-800/30'},
  @{o='text-green-700';n='text-green-400'},
  @{o='text-green-600';n='text-green-400'},
  @{o='bg-red-50';n='bg-red-900/20'},
  @{o='border-red-200';n='border-red-800/30'},
  @{o='text-red-700';n='text-red-400'},
  @{o='text-red-600';n='text-red-400'},
  @{o='bg-blue-50';n='bg-blue-900/20'},
  @{o='border-blue-200';n='border-blue-800/30'},
  @{o='text-blue-700';n='text-blue-400'},
  @{o='text-blue-600';n='text-blue-400'},
  @{o='bg-yellow-50';n='bg-yellow-900/20'},
  @{o='border-yellow-200';n='border-yellow-800/30'},
  @{o='text-yellow-700';n='text-yellow-400'},
  @{o='text-yellow-600';n='text-yellow-400'},
  @{o='hover:bg-gray-50';n='hover:bg-[#252525]'},
  @{o='hover:bg-gray-100';n='hover:bg-[#2A2A2A]'},
  @{o='hover:bg-gray-200';n='hover:bg-[#333]'},
  @{o='hover:text-gray-700';n='hover:text-[#C0C0C0]'},
  @{o='hover:text-gray-900';n='hover:text-[#F5F5F5]'},
  @{o='hover:text-gray-600';n='hover:text-[#A0A0A0]'},
  @{o='hover:border-gray-300';n='hover:border-[#444]'},
  @{o='placeholder-gray-400';n='placeholder-[#666]'},
  @{o='placeholder:text-gray-400';n='placeholder:text-[#666]'},
  @{o='peer-checked:bg-orange-500';n='peer-checked:bg-gold-500'},
  @{o='accent-orange-500';n='accent-gold-500'}
)

$totalChanged = 0
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content
  foreach ($r in $replacements) {
    $escaped = [regex]::Escape($r.o)
    $content = [regex]::Replace($content, $escaped, $r.n)
  }
  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    $rel = $file.FullName.Replace("d:\Dev\work\tobacco-supabase\frontend\","")
    Write-Host "Updated: $rel"
    $totalChanged++
  }
}
Write-Host "`nTotal files updated: $totalChanged"
