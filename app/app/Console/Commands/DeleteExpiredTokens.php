<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DeleteExpiredTokens extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'tokens:delete-expired';

    /**
     * The console command description.
     */
    protected $description = 'Delete expired authentication tokens';


    /**
     * Execute the console command.
     */
    public function handle()
    {
        $expiration = config('sanctum.expiration', 1440);
        $expirationTime = Carbon::now()->subMinutes($expiration);

        $deletedCount = PersonalAccessToken::where('created_at', '<', $expirationTime)
            ->delete();

        $this->info("✓ Deleted {$deletedCount} expired token(s).");
        Log::info("Token cleanup: deleted {$deletedCount} tokens");

        return 0;
    }
}
