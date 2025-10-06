<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string("name");
            $table->text("description");
            $table->dateTime("date_time");
            $table->integer("duration")->comment("duration in minutes");
            $table->string("location");
            $table->integer("capacity");
            $table->integer('waitlist_capacity');
            $table->enum('status', ['draft', 'published'])->default('draft');

            $table->timestamps();

            // index
            $table->index('date_time');
            $table->index('status');
            $table->index(['date_time', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
