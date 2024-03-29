class EnemiesController < ApplicationController

    def create
        numberOfEnemies = params[:numberOfEnemies]
        enemies = []
        modifier = params[:currentLevel]/5 * 0.5 + 1
        if params[:currentLevel] % 10 == 0
            enemy_archetype = EnemyArchetype.find(rand(1..6))
            enemies << Enemy.create!(dive_id: params[:dive_id], enemy_archetype_id: enemy_archetype.id, hp: enemy_archetype.hp_modifier * 20 * modifier, attack: enemy_archetype.attack_modifier * 20 * modifier, defense: enemy_archetype.defense_modifier * 20 * modifier, speed: enemy_archetype.speed_modifier * 20 * modifier, boss: true)
        else
            numberOfEnemies.times {
                enemy_archetype = EnemyArchetype.find(rand(1..6))
                enemies << Enemy.create!(dive_id: params[:dive_id], enemy_archetype_id: enemy_archetype.id, hp: enemy_archetype.hp_modifier * 10 * modifier, attack: enemy_archetype.attack_modifier * 10 * modifier, defense: enemy_archetype.defense_modifier * 10 * modifier, speed: enemy_archetype.speed_modifier * 10 * modifier)
            }
        end
        render json: enemies, status: :created
    end

    def update
        enemy = Enemy.find(params[:id])
        enemy.update!(enemy_params)
        render json: enemy, status: :ok
    end

    def destroy
        enemy = Enemy.find(params[:id])
        dive = enemy.dive
        dive.update!(enemies_slain: dive.enemies_slain + 1)
        enemy.destroy
        head :no_content
    end

    private

    def enemy_params
        params.permit(:level, :dive_id, :hp)
    end
end
